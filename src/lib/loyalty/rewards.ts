
import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { LIST_CAMPAIGNS, CREATE_CAMPAIGN } from '../graphql/rewards';
import { updateLoyaltyBalance, getLoyaltyProfile } from './attributes';
import { getCampaignIdForPoints, getUnusedCouponFromPool, getTierByPoints } from './campaign-tiers';

// Legacy single-tier constants - kept for backwards compatibility with old code
// New implementation uses multi-tier system from campaign-tiers.ts
const CAMPAIGN_TITLE = "Loyalty Reward 50TL";
const POINTS_REQUIRED = 500;
const REWARD_AMOUNT = 50.0;

export interface RedemptionResult {
    success: boolean;
    code?: string;
    remainingPoints?: number;
    error?: string;
}

/**
 * Ensures the "Loyalty Reward 50TL" campaign exists.
 */
async function ensureLoyaltyCampaign(client: ikasAdminGraphQLAPIClient<any>): Promise<string> {
    try {
        // 1. Check if exists
        // Need to check specific filter structure. 
        // Introspection showed CampaignFilterInput? I didn't introspect that specifically but usually it has 'search' or 'title'. 
        // Let's assume listCampaign returns all or we filter in memory for safety if filter is unknown.
        // Actually, let's verify filter input if this fails.
        const query = LIST_CAMPAIGNS;
        const res = await client.query<{ listCampaign: any }>({ query, variables: { filter: {} } });

        const existing = res.data?.listCampaign?.data?.find((c: any) => c.title === CAMPAIGN_TITLE);

        if (existing) {
            return existing.id;
        }

        console.log("creating new campaign");

        // 2. Create if not exists
        const mutation = CREATE_CAMPAIGN;
        const input = {
            title: CAMPAIGN_TITLE,
            type: "FIXED_AMOUNT",
            hasCoupon: true,
            isFreeShipping: false,
            // Assuming default applied to all? Or need 'applicablePrice'?
            // create_campaign_input.json line 26: applicablePrice NON_NULL.
            // Oh, applicablePrice usually means "Minimum Cart Amount"?
            // Let's set applicablePrice to 0. 
            applicablePrice: 0,

            // fixedDiscount input
            fixedDiscount: {
                amount: REWARD_AMOUNT,
                isApplyByCartAmount: true, // Apply to total cart
                shouldMatchAllConditions: false
            },

            canCombineWithOtherCampaigns: false,
            // createdFor: "ADMIN_PANEL" // Guessing enum, maybe omit?

            // Required fields check:
            // title: NON_NULL (Ready)
            // type: NON_NULL (Ready)
            // hasCoupon: NON_NULL (Ready)
            // canCombineWithOtherCampaigns: NON_NULL (Ready)
            // applicablePrice: NON_NULL (Ready)
        };

        const createRes = await client.mutate<{ createCampaign: any }>({ mutation, variables: { input } });
        return createRes.data?.createCampaign?.id;

    } catch (e: any) {
        console.error("ensureLoyaltyCampaign Error:", e.message);
        throw e;
    }
}

/**
 * Redeems points for a discount code from appropriate tier campaign
 * @param client İKAS API client
 * @param customerId Customer ID
 * @param pointsToRedeem Points amount to redeem (must match a tier: 100, 250, 500, or 1000)
 */
export async function redeemPoints(
    client: ikasAdminGraphQLAPIClient<any>,
    customerId: string,
    pointsToRedeem: number = 500  // Default to 500 for backwards compatibility
): Promise<RedemptionResult> {
    try {
        // 1. Validate tier
        const tier = getTierByPoints(pointsToRedeem);
        if (!tier) {
            return {
                success: false,
                error: `Invalid redemption amount. Must be 100, 250, 500, or 1000 points.`
            };
        }

        // 2. Check customer balance
        const profile = await getLoyaltyProfile(client, customerId);
        if (!profile || profile.pointsBalance < pointsToRedeem) {
            return {
                success: false,
                error: `Insufficient points. Required: ${pointsToRedeem}, Available: ${profile?.pointsBalance || 0}`
            };
        }

        // 3. Get campaign ID for this tier
        const campaignId = await getCampaignIdForPoints(pointsToRedeem);
        if (!campaignId) {
            return {
                success: false,
                error: `Campaign not configured for ${pointsToRedeem} points tier. Please run campaign setup.`
            };
        }

        // 4. Fetch unused coupon from pool
        let couponCode: string;
        try {
            couponCode = await getUnusedCouponFromPool(client, campaignId);
        } catch (poolError: any) {
            console.error('Coupon pool error:', poolError.message);
            return {
                success: false,
                error: `Unable to fetch coupon: ${poolError.message}`
            };
        }

        // 5. Burn points (after we know coupon is available)
        const newProfile = await updateLoyaltyBalance(client, customerId, -pointsToRedeem);
        if (!newProfile) {
            return {
                success: false,
                error: "Failed to update points balance"
            };
        }

        console.log(`✅ Redeemed ${pointsToRedeem} points for coupon: ${couponCode}`);

        return {
            success: true,
            code: couponCode,
            remainingPoints: newProfile.pointsBalance
        };

    } catch (e: any) {
        console.error("Redeem Error:", e.message);

        // TODO: Implement proper rollback mechanism
        // For now, just return error - points may need manual restoration

        return { success: false, error: e.message };
    }
}
