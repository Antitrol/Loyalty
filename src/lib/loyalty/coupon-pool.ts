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

        const res = await client.query({
            query: GET_CAMPAIGN_COUPONS,
            variables: {
                campaignId,
                limit: 50,  // Fetch 50 at a time to find an unused one
                offset: 0
            }
        });

        // DEBUG: Log full response
        console.log('📊 Full GraphQL Response:', JSON.stringify(res, null, 2));

        // listCampaign returns all campaigns, find ours by ID
        const campaigns = res.data?.listCampaign?.data || [];

        console.log('📊 Total campaigns returned:', campaigns.length);
        console.log('📊 Looking for campaign ID:', campaignId);

        // Find our specific campaign
        const campaign = campaigns.find((c: any) => c.id === campaignId);

        console.log('📊 Campaign found:', !!campaign);
        if (campaign) {
            console.log('📊 Campaign title:', campaign.title);
            console.log('📊 Campaign ID:', campaign.id);
        }

        if (!campaign) {
            console.error('❌ Campaign not found in results');
            console.error('   Looking for ID:', campaignId);
            console.error('   Available campaign IDs:', campaigns.map((c: any) => c.id));
            return null;
        }

        const coupons = campaign.coupons?.data || [];

        console.log(`📊 Coupons array length: ${coupons.length}`);
        console.log(`📊 Total coupons in campaign: ${campaign.coupons?.total || 0}`);
        console.log(`📊 Sample coupons:`, JSON.stringify(coupons.slice(0, 3), null, 2));

        if (coupons.length === 0) {
            console.error('❌ No coupons found in campaign pool');
            console.error('   Campaign ID:', campaignId);
            console.error('   Campaign title:', campaign.title);
            console.error('   Total coupons:', campaign.coupons?.total);
            return null;
        }

        // Find first unused coupon
        const unused = coupons.find((c: any) =>
            (c.usageCount || 0) < (c.usageLimit || 1)
        );

        if (!unused) {
            console.error('❌ All coupons in sample are used. Pool may be depleted.');
            console.error('   Sample coupons:', coupons.map((c: any) => `${c.code}: ${c.usageCount}/${c.usageLimit}`));
            return null;
        }

        console.log(`✅ Found unused coupon: ${unused.code}`);
        return unused.code;

    } catch (error: any) {
        console.error('❌ Error fetching coupon from pool:', error.message);
        console.error('   Full error:', error);
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
                limit: 50,
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
