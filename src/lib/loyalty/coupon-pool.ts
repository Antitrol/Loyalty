/**
 * Coupon Pool Manager
 * Manages pre-generated coupon pools from İKAS campaigns
 */

import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { GET_CAMPAIGN_COUPONS } from '../graphql/rewards';

export interface CouponPoolStats {
    total: number;
    used: number;
    available: number;
    sampleCoupons: Array<{
        code: string;
        usageCount: number;
        usageLimit: number;
    }>;
}

/**
 * Fetch an unused coupon from İKAS campaign pool
 * Returns null if no unused coupons are available
 */
export async function getUnusedCouponFromCampaign(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string
): Promise<string | null> {
    try {
        console.log(`🎫 Fetching unused coupon from campaign ${campaignId}...`);

        // Fetch batch of coupons from pool
        const res = await client.query({
            query: GET_CAMPAIGN_COUPONS,
            variables: {
                campaignId,
                limit: 50,  // Fetch 50 at a time to find an unused one
                offset: 0
            }
        });

        const coupons = res.data?.campaign?.coupons?.data || [];

        if (coupons.length === 0) {
            console.error('❌ No coupons found in campaign pool');
            return null;
        }

        // Find first unused coupon
        const unused = coupons.find((c: any) =>
            (c.usageCount || 0) < (c.usageLimit || 1)
        );

        if (!unused) {
            console.error('❌ All coupons in sample are used. Pool may be depleted.');
            return null;
        }

        console.log(`✅ Found unused coupon: ${unused.code}`);
        return unused.code;

    } catch (error: any) {
        console.error('❌ Error fetching coupon from pool:', error.message);
        if (error.response?.errors) {
            error.response.errors.forEach((err: any) => {
                console.error(`   - ${err.message}`);
            });
        }
        return null;
    }
}

/**
 * Get pool statistics for monitoring
 * Useful for checking if pool needs replenishment
 */
export async function getCouponPoolStats(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string
): Promise<CouponPoolStats | null> {
    try {
        const res = await client.query({
            query: GET_CAMPAIGN_COUPONS,
            variables: {
                campaignId,
                limit: 100,  // Get larger sample for stats
                offset: 0
            }
        });

        const campaign = res.data?.campaign;
        if (!campaign) {
            return null;
        }

        const coupons = campaign.coupons?.data || [];
        const total = campaign.coupons?.total || 0;

        const used = coupons.filter((c: any) =>
            (c.usageCount || 0) >= (c.usageLimit || 1)
        ).length;

        const available = coupons.filter((c: any) =>
            (c.usageCount || 0) < (c.usageLimit || 1)
        ).length;

        return {
            total,
            used,
            available,
            sampleCoupons: coupons.slice(0, 5).map((c: any) => ({
                code: c.code,
                usageCount: c.usageCount || 0,
                usageLimit: c.usageLimit || 1
            }))
        };

    } catch (error: any) {
        console.error('Error getting pool stats:', error.message);
        return null;
    }
}

/**
 * Check if pool needs replenishment
 * Returns true if available coupons are low
 */
export async function shouldReplenishPool(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string,
    threshold: number = 100
): Promise<boolean> {
    const stats = await getCouponPoolStats(client, campaignId);
    if (!stats) return true;  // If can't check, assume yes

    return stats.available < threshold;
}
