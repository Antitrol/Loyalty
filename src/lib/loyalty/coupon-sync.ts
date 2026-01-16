/**
 * Coupon Sync Helper
 * Fetches existing coupons from İKAS campaigns and stores in database pool
 */

import { prisma } from '../prisma';
import { LIST_COUPONS } from '../graphql/rewards';

/**
 * Fetch coupons from İKAS and store in database pool
 * 
 * @param ikasClient - GraphQL client instance with auth
 * @param campaignId - İKAS campaign ID
 * @param tier - Point tier (100, 250, 500, 1000)
 * @param limit - Maximum coupons to sync (default: 1000)
 * @returns Number of coupons synced
 */
export async function syncCouponsFromIKAS(
    ikasClient: any,
    campaignId: string,
    tier: number,
    limit: number = 1000
): Promise<number> {
    console.log(`🔄 Syncing coupons from İKAS...`);
    console.log(`   Campaign: ${campaignId}`);
    console.log(`   Tier: ${tier} points`);
    console.log(`   Limit: ${limit}`);

    let totalSynced = 0;
    let page = 1;
    let hasMore = true;

    try {
        while (hasMore && totalSynced < limit) {
            // Fetch coupons from İKAS
            const response = await ikasClient.query({
                query: LIST_COUPONS,
                variables: {
                    campaignId: { eq: campaignId },
                    pagination: {
                        limit: Math.min(100, limit - totalSynced),
                        page
                    },
                    includeDeleted: false
                }
            });

            const coupons = response.data?.listCoupon?.data || [];

            if (coupons.length === 0) {
                console.log(`   No more coupons found on page ${page}`);
                hasMore = false;
                break;
            }

            console.log(`   Page ${page}: Found ${coupons.length} coupons`);

            // Filter unused coupons
            const unusedCoupons = coupons.filter((c: any) =>
                c.usageCount === 0 && !c.deleted
            );

            console.log(`   Page ${page}: ${unusedCoupons.length} unused`);

            // Store in database
            if (unusedCoupons.length > 0) {
                const result = await prisma.couponPool.createMany({
                    data: unusedCoupons.map((c: any) => ({
                        code: c.code,
                        campaignId: c.campaignId,
                        tier
                    })),
                    skipDuplicates: true
                });

                totalSynced += result.count;
                console.log(`   Page ${page}: Synced ${result.count} to database (total: ${totalSynced})`);
            }

            hasMore = response.data?.listCoupon?.hasNext || false;
            page++;

            // Safety limit
            if (page > 50) {
                console.log(`   ⚠️ Reached page limit (50), stopping`);
                break;
            }
        }

        console.log(`✅ Sync complete: ${totalSynced} coupons synced`);
        return totalSynced;

    } catch (error: any) {
        console.error(`❌ Sync error:`, error.message);
        throw new Error(`Failed to sync coupons from İKAS: ${error.message}`);
    }
}

/**
 * Check if campaign has coupons available in İKAS
 */
export async function checkCampaignCoupons(
    ikasClient: any,
    campaignId: string
): Promise<{ total: number; unused: number }> {
    try {
        const response = await ikasClient.query({
            query: LIST_COUPONS,
            variables: {
                campaignId: { eq: campaignId },
                pagination: { limit: 1, page: 1 },
                includeDeleted: false
            }
        });

        const total = response.data?.listCoupon?.count || 0;

        return {
            total,
            unused: total // Simplified - would need full scan for accuracy
        };

    } catch (error: any) {
        console.error('Error checking campaign coupons:', error.message);
        return { total: 0, unused: 0 };
    }
}
