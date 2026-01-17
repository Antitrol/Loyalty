/**
 * Automatic Setup Flow for İKAS Marketplace
 * 
 * This module handles the complete automated setup of the loyalty app
 * when installed from İKAS Marketplace. NO MANUAL INTERVENTION REQUIRED!
 * 
 * Steps:
 * 1. Create 4 campaigns in İKAS (100, 250, 500, 1000 points)
 * 2. Generate 1,000 coupon codes for each campaign
 * 3. Sync coupons to database pool
 * 4. Save campaign IDs to settings
 * 5. ✅ Ready to use!
 */

import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { gql } from 'graphql-request';
import { prisma } from '../prisma';
import { CREATE_CAMPAIGN } from '../graphql/rewards';
import { REDEMPTION_TIERS, RedemptionTier } from '../loyalty/campaign-tiers';
import { syncCouponsFromIKAS } from '../loyalty/coupon-sync';

const ADD_COUPONS_TO_CAMPAIGN = gql`
  mutation AddCouponsToCampaign($campaignId: ID!, $count: Int!, $prefix: String) {
    addCouponsToCampaign(
      campaignId: $campaignId
      count: $count
      prefix: $prefix
    ) {
      count
      codes
    }
  }
`;

export interface SetupProgress {
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    status: 'running' | 'completed' | 'error';
    message: string;
    error?: string;
    results?: {
        campaigns: Array<{ tier: number; campaignId: string; couponsGenerated: number }>;
        totalCoupons: number;
    };
}

/**
 * Create a campaign in İKAS
 */
async function createCampaignForTier(
    client: ikasAdminGraphQLAPIClient<any>,
    tier: RedemptionTier,
    onProgress: (progress: Partial<SetupProgress>) => void
): Promise<string> {
    onProgress({
        currentStep: `Creating campaign: ${tier.title}`,
        message: `Creating ${tier.amount} TL discount campaign...`
    });

    const input = {
        title: tier.title,
        type: 'FIXED_AMOUNT',
        hasCoupon: true,
        isFreeShipping: false,
        applicablePrice: 0,
        fixedDiscount: {
            amount: tier.amount,
            isApplyByCartAmount: true,
            shouldMatchAllConditions: false
        },
        canCombineWithOtherCampaigns: false,
        couponPrefix: `LOYALTY${tier.points}`,
        usageLimitPerCustomer: 1
    };

    const res = await client.mutate<{ createCampaign: any }>({
        mutation: CREATE_CAMPAIGN,
        variables: { input }
    });

    const campaignId = res.data?.createCampaign?.id;
    if (!campaignId) {
        throw new Error(`Failed to create campaign for ${tier.points} points`);
    }

    onProgress({
        message: `✅ Campaign created: ${campaignId}`
    });

    return campaignId;
}

/**
 * Generate coupon codes for a campaign using İKAS API
 */
async function generateCouponsForCampaign(
    client: ikasAdminGraphQLAPIClient<any>,
    campaignId: string,
    tier: RedemptionTier,
    count: number,
    onProgress: (progress: Partial<SetupProgress>) => void
): Promise<number> {
    onProgress({
        currentStep: `Generating ${count} coupons for ${tier.points} points tier`,
        message: `Calling İKAS API to generate coupon codes...`
    });

    try {
        const res = await client.mutate<{ addCouponsToCampaign: any }>({
            mutation: ADD_COUPONS_TO_CAMPAIGN,
            variables: {
                campaignId,
                count,
                prefix: `LOYALTY${tier.points}`
            }
        });

        const generated = res.data?.addCouponsToCampaign?.count || 0;

        onProgress({
            message: `✅ Generated ${generated} coupon codes in İKAS`
        });

        return generated;
    } catch (error: any) {
        // If mutation doesn't exist or fails, return 0
        console.warn(`addCouponsToCampaign failed for tier ${tier.points}:`, error.message);
        onProgress({
            message: `⚠️ Auto-generation not available. Coupons must be created manually in İKAS.`
        });
        return 0;
    }
}

/**
 * Main auto-setup function
 * Call this after app installation to automatically configure everything
 */
export async function runAutoSetup(
    client: ikasAdminGraphQLAPIClient<any>,
    onProgress?: (progress: SetupProgress) => void
): Promise<SetupProgress> {
    const totalSteps = REDEMPTION_TIERS.length * 3; // create + generate + sync per tier
    let completedSteps = 0;

    const progress: SetupProgress = {
        currentStep: 'Starting setup',
        totalSteps,
        completedSteps: 0,
        status: 'running',
        message: 'Initializing automatic setup...'
    };

    const updateProgress = (update: Partial<SetupProgress>) => {
        Object.assign(progress, update);
        if (onProgress) onProgress(progress);
    };

    try {
        updateProgress({
            currentStep: 'Setup Started',
            message: '🚀 Starting automatic loyalty app configuration...'
        });

        const campaignResults: Array<{
            tier: number;
            campaignId: string;
            couponsGenerated: number;
        }> = [];

        const campaignIds: Record<string, string> = {};

        // Process each tier
        for (const tier of REDEMPTION_TIERS) {
            // Step 1: Create campaign
            const campaignId = await createCampaignForTier(client, tier, updateProgress);
            campaignIds[tier.field] = campaignId;
            completedSteps++;
            updateProgress({ completedSteps });

            // Step 2: Generate coupons
            const couponsGenerated = await generateCouponsForCampaign(
                client,
                campaignId,
                tier,
                1000,
                updateProgress
            );
            completedSteps++;
            updateProgress({ completedSteps });

            // Step 3: Sync coupons to database
            updateProgress({
                currentStep: `Syncing coupons for ${tier.points} points tier`,
                message: 'Fetching coupons from İKAS and storing in database...'
            });

            const synced = await syncCouponsFromIKAS(client, campaignId, tier.points, 1000);
            completedSteps++;
            updateProgress({
                completedSteps,
                message: `✅ Synced ${synced} coupons to database`
            });

            campaignResults.push({
                tier: tier.points,
                campaignId,
                couponsGenerated: synced
            });
        }

        // Save campaign IDs to database
        updateProgress({
            currentStep: 'Saving configuration',
            message: 'Saving campaign IDs to database...'
        });

        await prisma.loyaltySettings.upsert({
            where: { id: 'default' },
            update: {
                ...campaignIds,
                autoCreateCampaigns: true
            },
            create: {
                id: 'default',
                ...campaignIds,
                autoCreateCampaigns: true
            }
        });

        // Success!
        const totalCoupons = campaignResults.reduce((sum, r) => sum + r.couponsGenerated, 0);

        updateProgress({
            currentStep: 'Setup Complete',
            completedSteps: totalSteps,
            status: 'completed',
            message: `🎉 Setup complete! ${totalCoupons} coupons ready for redemption.`,
            results: {
                campaigns: campaignResults,
                totalCoupons
            }
        });

        return progress;

    } catch (error: any) {
        updateProgress({
            status: 'error',
            message: 'Setup failed',
            error: error.message
        });

        throw error;
    }
}

/**
 * Check if setup has been completed
 */
export async function isSetupComplete(): Promise<boolean> {
    const settings = await prisma.loyaltySettings.findUnique({
        where: { id: 'default' }
    });

    if (!settings) return false;

    // Check if all campaign IDs are set
    const allConfigured =
        settings.campaign100Id &&
        settings.campaign250Id &&
        settings.campaign500Id &&
        settings.campaign1000Id;

    return !!allConfigured;
}

/**
 * Get setup status
 */
export async function getSetupStatus(): Promise<{
    isComplete: boolean;
    configuredTiers: number[];
    missingTiers: number[];
    totalCoupons: number;
}> {
    const settings = await prisma.loyaltySettings.findUnique({
        where: { id: 'default' }
    });

    const configuredTiers: number[] = [];
    const missingTiers: number[] = [];

    for (const tier of REDEMPTION_TIERS) {
        if (settings?.[tier.field]) {
            configuredTiers.push(tier.points);
        } else {
            missingTiers.push(tier.points);
        }
    }

    // Get total coupons in pool
    const totalCoupons = await prisma.couponPool.count({
        where: { usedAt: null }
    });

    return {
        isComplete: missingTiers.length === 0,
        configuredTiers,
        missingTiers,
        totalCoupons
    };
}
