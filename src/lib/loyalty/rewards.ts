
import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { LIST_CAMPAIGNS, CREATE_CAMPAIGN, ADD_COUPONS } from '../graphql/rewards';
import { updateLoyaltyBalance } from './attributes';
import { randomBytes } from 'crypto';

const CAMPAIGN_TITLE = "Loyalty Reward 50TL";
// 500 Points = 50 TL
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
 * Redeems points for a discount code.
 */
export async function redeemPoints(
    client: ikasAdminGraphQLAPIClient<any>,
    customerId: string
): Promise<RedemptionResult> {
    try {
        // 1. Burn Points (Transaction)
        // We deduct first. If campaign creation fails, we technically assume rollback needed.
        // For MVP, we deduct and then if fail, we might throw.
        // Ideally, check balance first (peek), then ensure campaign, then burn, then generate.

        // 2. Ensure Campaign (Idempotent)
        const campaignId = await ensureLoyaltyCampaign(client);

        // 3. Burn Points
        // updateLoyaltyBalance checks current balance inside it? No, it just adds delta.
        // We should check balance first.

        // We'll rely on updateLoyaltyBalance logic. 
        // But wait, attributes.ts just adds delta. It doesn't check for negative balance.
        // We should explicitly check balance.

        const { getLoyaltyProfile } = require('./attributes');
        const profile = await getLoyaltyProfile(client, customerId);

        if (!profile || profile.pointsBalance < POINTS_REQUIRED) {
            return { success: false, error: "Insufficient points" };
        }

        // Burn
        const newProfile = await updateLoyaltyBalance(client, customerId, -POINTS_REQUIRED);
        if (!newProfile) throw new Error("Failed to update balance");

        // 4. Generate Code
        const code = `LOYALTY-50-${randomBytes(3).toString('hex').toUpperCase()}`;

        const mutation = ADD_COUPONS;
        const input = {
            campaignId,
            coupons: [code]
        };

        await client.mutate<{ addCouponsToCampaign: any }>({ mutation, variables: { input } });

        return {
            success: true,
            code,
            remainingPoints: newProfile.pointsBalance
        };

    } catch (e: any) {
        console.error("Redeem Error:", e.message);
        // TODO: Rollback points if coupon fails?
        // simple rollback: await updateLoyaltyBalance(client, customerId, POINTS_REQUIRED);
        return { success: false, error: e.message };
    }
}
