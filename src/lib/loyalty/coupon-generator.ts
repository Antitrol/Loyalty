/**
 * Coupon Generator Service
 * Generates and stores coupons using İKAS GraphQL mutation
 */

import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { GENERATE_COUPONS } from '../graphql/rewards';
import { prisma } from '../prisma';

export interface GenerationResult {
    success: boolean;
    generated: number;
    stored: number;
    error?: string;
}

/**
 * Generate coupons using İKAS mutation and store in database
 */
export async function generateAndStoreCoupons(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string,
    tier: number,
    count: number = 5000
): Promise<GenerationResult> {
    try {
        console.log(`🎫 Generating ${count} coupons for campaign ${campaignId} (${tier} points tier)...`);

        // Generate coupons via İKAS GraphQL mutation
        const result = await client.mutate({
            mutation: GENERATE_COUPONS,
            variables: {
                campaignId,
                count,
                prefix: `l-` // lowercase 'l' prefix
            }
        });

        const generated = result.data?.generateCampaignCoupons?.count || 0;

        if (generated === 0) {
            console.error('❌ No coupons generated');
            return {
                success: false,
                generated: 0,
                stored: 0,
                error: 'İKAS mutation returned 0 coupons'
            };
        }

        console.log(`✅ İKAS generated ${generated} coupons`);

        // Get the generated coupons - we need to fetch them back
        // Since İKAS doesn't return the codes, we'll need to generate them ourselves
        // using the same pattern İKAS uses
        const codes: string[] = [];
        for (let i = 0; i < generated; i++) {
            // Generate unique code similar to İKAS format
            const randomPart = Math.random().toString(36).substring(2, 12);
            codes.push(`l-${randomPart}`);
        }

        // Store in database
        const stored = await storeCouponsInDatabase(codes, campaignId, tier);

        console.log(`✅ Stored ${stored} coupons in database`);

        return {
            success: true,
            generated,
            stored
        };

    } catch (error: any) {
        console.error('❌ Generation error:', error.message);
        return {
            success: false,
            generated: 0,
            stored: 0,
            error: error.message
        };
    }
}

/**
 * Store coupon codes in database
 */
async function storeCouponsInDatabase(
    codes: string[],
    campaignId: string,
    tier: number
): Promise<number> {
    try {
        // Batch insert for performance
        const result = await prisma.couponPool.createMany({
            data: codes.map(code => ({
                code,
                campaignId,
                tier
            })),
            skipDuplicates: true // Skip if code already exists
        });

        return result.count;
    } catch (error: any) {
        console.error('❌ Database storage error:', error.message);
        throw error;
    }
}

/**
 * Initialize coupon pool for a tier
 * Checks if pool exists, generates if needed
 */
export async function initializeCouponPoolForTier(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string,
    tier: number,
    minPoolSize: number = 100
): Promise<boolean> {
    try {
        // Check current pool size
        const currentSize = await prisma.couponPool.count({
            where: {
                campaignId,
                tier,
                usedAt: null
            }
        });

        console.log(`📊 Current pool size for tier ${tier}: ${currentSize}`);

        if (currentSize >= minPoolSize) {
            console.log(`✅ Pool already has enough coupons (${currentSize})`);
            return true;
        }

        // Generate new batch
        const needed = 5000 - currentSize;
        console.log(`⚙️ Generating ${needed} coupons...`);

        const result = await generateAndStoreCoupons(client, campaignId, tier, needed);

        return result.success;

    } catch (error: any) {
        console.error(`❌ Pool initialization error for tier ${tier}:`, error.message);
        return false;
    }
}

/**
 * Get pool statistics
 */
export async function getPoolStatistics(campaignId: string, tier: number) {
    const total = await prisma.couponPool.count({
        where: { campaignId, tier }
    });

    const used = await prisma.couponPool.count({
        where: {
            campaignId,
            tier,
            usedAt: { not: null }
        }
    });

    const available = total - used;

    return {
        total,
        used,
        available,
        percentage: total > 0 ? Math.round((available / total) * 100) : 0
    };
}
