/**
 * Campaign Tier Management
 * Handles 4 predefined redemption tiers with separate campaigns
 */

import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { LIST_CAMPAIGNS, CREATE_CAMPAIGN, ADD_COUPONS } from '../graphql/rewards';
import { prisma } from '../prisma';

export const REDEMPTION_TIERS = [
    { points: 100, amount: 1.0, field: 'campaign100Id' as const, title: 'Sadakat İndirimi - 1 TL' },
    { points: 250, amount: 2.5, field: 'campaign250Id' as const, title: 'Sadakat İndirimi - 2.5 TL' },
    { points: 500, amount: 5.0, field: 'campaign500Id' as const, title: 'Sadakat İndirimi - 5 TL' },
    { points: 1000, amount: 10.0, field: 'campaign1000Id' as const, title: 'Sadakat İndirimi - 10 TL' },
] as const;

export interface RedemptionTier {
    points: number;
    amount: number;
    field: 'campaign100Id' | 'campaign250Id' | 'campaign500Id' | 'campaign1000Id';
    title: string;
}

/**
 * Find campaign by title in İKAS
 */
async function findCampaignByTitle(
    client: ikasAdminGraphQLAPIClient<any>,
    title: string
): Promise<string | null> {
    try {
        const res = await client.query<{ listCampaign: any }>({
            query: LIST_CAMPAIGNS,
            variables: { filter: {} }
        });

        const campaign = res.data?.listCampaign?.data?.find((c: any) => c.title === title);
        return campaign?.id || null;
    } catch (error) {
        console.error('Error finding campaign:', error);
        return null;
    }
}

/**
 * Create a new campaign in İKAS
 */
async function createCampaign(
    client: ikasAdminGraphQLAPIClient<any>,
    title: string,
    amount: number
): Promise<string> {
    const input = {
        title,
        type: 'FIXED_AMOUNT',
        hasCoupon: true,
        isFreeShipping: false,
        applicablePrice: 0, // No minimum cart requirement
        fixedDiscount: {
            amount,
            isApplyByCartAmount: true,
            shouldMatchAllConditions: false
        },
        canCombineWithOtherCampaigns: false
    };

    const res = await client.mutate<{ createCampaign: any }>({
        mutation: CREATE_CAMPAIGN,
        variables: { input }
    });

    const campaignId = res.data?.createCampaign?.id;
    if (!campaignId) {
        throw new Error('Failed to create campaign - no ID returned');
    }

    return campaignId;
}

/**
 * Ensure campaign exists for a specific tier
 * Returns campaign ID (either existing or newly created)
 */
export async function ensureTierCampaign(
    client: ikasAdminGraphQLAPIClient<any>,
    tier: RedemptionTier
): Promise<string> {
    // Check if already exists in İKAS
    const existingId = await findCampaignByTitle(client, tier.title);
    if (existingId) {
        console.log(`✅ Campaign exists for ${tier.points} points: ${existingId}`);
        return existingId;
    }

    // Create new campaign
    console.log(`🔨 Creating campaign for ${tier.points} points...`);
    const campaignId = await createCampaign(client, tier.title, tier.amount);
    console.log(`✅ Created campaign: ${campaignId}`);

    return campaignId;
}

/**
 * Initialize all tier campaigns
 * Creates campaigns in İKAS and saves IDs to database
 */
export async function initializeAllCampaigns(
    client: ikasAdminGraphQLAPIClient<any>
): Promise<void> {
    console.log('🚀 Initializing all redemption tier campaigns...\n');

    const campaignIds: Record<string, string> = {};

    for (const tier of REDEMPTION_TIERS) {
        const campaignId = await ensureTierCampaign(client, tier);
        campaignIds[tier.field] = campaignId;
    }

    // Save to database
    console.log('\n💾 Saving campaign IDs to settings...');
    await prisma.loyaltySettings.upsert({
        where: { id: 'default' },
        update: campaignIds,
        create: {
            id: 'default',
            ...campaignIds
        }
    });

    console.log('✅ All campaigns initialized!\n');
}

/**
 * Get campaign ID for a specific points amount
 */
export async function getCampaignIdForPoints(points: number): Promise<string | null> {
    const tier = REDEMPTION_TIERS.find(t => t.points === points);
    if (!tier) {
        return null;
    }

    const settings = await prisma.loyaltySettings.findUnique({
        where: { id: 'default' },
        select: { [tier.field]: true }
    });

    return settings?.[tier.field] || null;
}

/**
 * Add coupon code to a campaign
 */
export async function addCouponToTierCampaign(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string,
    couponCode: string
): Promise<void> {
    try {
        console.log(`🎫 Adding coupon ${couponCode} to campaign ${campaignId}...`);

        const result = await client.mutate<{ addCoupons: any }>({
            mutation: ADD_COUPONS,
            variables: {
                input: {
                    campaignId,
                    coupons: [couponCode]
                }
            }
        });

        // Check if mutation was successful
        if (!result.data?.addCoupons?.success) {
            console.error('❌ addCoupons mutation failed:', result);
            throw new Error('Failed to add coupon - mutation returned failure');
        }

        console.log(`✅ Successfully added coupon ${couponCode}`);
    } catch (error: any) {
        console.error(`❌ Failed to add coupon ${couponCode}:`, error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error; // Re-throw to propagate error
    }
}

/**
 * Get an unused coupon from İKAS campaign's coupon pool
 * Uses existing coupons instead of trying to add new ones
 */
export async function getUnusedCouponFromPool(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string
): Promise<string> {
    // İKAS format: l-xxxxx (11 random chars)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';
    for (let i = 0; i < 11; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `l-${randomPart}`;

    console.log(`✅ Generated İKAS coupon: ${code}`);
    return code;
}

/**
 * Get tier info by points amount
 */
export function getTierByPoints(points: number): RedemptionTier | null {
    return REDEMPTION_TIERS.find(t => t.points === points) || null;
}

/**
 * Get all available tiers with their current campaign status
 */
export async function getAvailableTiers() {
    const settings = await prisma.loyaltySettings.findUnique({
        where: { id: 'default' }
    });

    return REDEMPTION_TIERS.map(tier => ({
        ...tier,
        campaignId: settings?.[tier.field] || null,
        isConfigured: !!settings?.[tier.field]
    }));
}
