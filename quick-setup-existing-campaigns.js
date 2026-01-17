/**
 * IMMEDIATE ACTION: Add coupons to existing campaigns
 * 
 * User has already created campaigns manually:
 * - 100 points: 2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0 (1 TL)
 * - 250 points: 95f1d418-1ed1-4a6c-8cac-d66a25499518 (2.5 TL)
 * - 500 points: 2ef154c7-659a-466c-a8f7-27eb8cd1a099 (5 TL)
 * - 1000 points: 36e6cc8b-b24e-4db2-b8aa-0e5e650de983 (10 TL)
 * 
 * This script will:
 * 1. Try to generate coupons using addCouponsToCampaign mutation
 * 2. If that fails, sync existing coupons from İKAS
 * 3. Save campaign IDs to database
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

const CAMPAIGNS = {
    100: {
        id: '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0',
        discount: '1 TL'
    },
    250: {
        id: '95f1d418-1ed1-4a6c-8cac-d66a25499518',
        discount: '2.5 TL'
    },
    500: {
        id: '2ef154c7-659a-466c-a8f7-27eb8cd1a099',
        discount: '5 TL'
    },
    1000: {
        id: '36e6cc8b-b24e-4db2-b8aa-0e5e650de983',
        discount: '10 TL'
    }
};

async function setupTier(tier, campaignId, discount) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 SETTING UP ${tier} POINTS TIER (${discount})`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Campaign ID: ${campaignId}\n`);

    // Step 1: Save campaign ID to database
    console.log(`Step 1: Saving campaign ID to database...`);
    try {
        const setCampaignRes = await fetch(`${PRODUCTION_URL}/api/admin/set-campaign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier, campaignId })
        });

        const setCampaignResult = await setCampaignRes.json();
        if (!setCampaignResult.success) {
            console.error(`   ❌ Failed:`, setCampaignResult.error);
            return false;
        }
        console.log(`   ✅ Campaign ID saved to database`);
    } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        return false;
    }

    // Step 2: Sync existing coupons from İKAS
    console.log(`\nStep 2: Syncing existing coupons from İKAS (up to 1,000)...`);
    try {
        const syncRes = await fetch(`${PRODUCTION_URL}/api/admin/sync-coupons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId,
                tier,
                limit: 1000
            })
        });

        const syncResult = await syncRes.json();
        if (!syncResult.success) {
            console.error(`   ❌ Sync failed:`, syncResult.error);
            return false;
        }

        console.log(`   ✅ Synced ${syncResult.synced} coupons`);
        console.log(`   📊 Pool status:`, syncResult.poolStats);

        return true;
    } catch (error) {
        console.error(`   ❌ Sync error:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 QUICK SETUP FOR EXISTING CAMPAIGNS\n');
    console.log('This will configure all 4 tiers with existing campaign IDs\n');

    const results = {};

    for (const [tier, campaign] of Object.entries(CAMPAIGNS)) {
        const success = await setupTier(parseInt(tier), campaign.id, campaign.discount);
        results[tier] = success;
    }

    // Summary
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 SETUP SUMMARY');
    console.log(`${'='.repeat(60)}\n`);

    let allSuccess = true;
    for (const [tier, success] of Object.entries(results)) {
        const campaign = CAMPAIGNS[tier];
        console.log(`${success ? '✅' : '❌'} ${tier} points (${campaign.discount}): ${success ? 'READY' : 'FAILED'}`);
        if (!success) allSuccess = false;
    }

    console.log('');

    if (allSuccess) {
        console.log('🎉 ALL TIERS CONFIGURED SUCCESSFULLY!\n');
        console.log('Your loyalty app is now ready with:');
        console.log('  ✅ 100 points → 1 TL discount');
        console.log('  ✅ 250 points → 2.5 TL discount');
        console.log('  ✅ 500 points → 5 TL discount');
        console.log('  ✅ 1000 points → 10 TL discount');
        console.log('\n📋 Next steps:');
        console.log('  1. Test redemption in widget');
        console.log('  2. Check coupon codes at checkout');
        console.log('  3. Monitor pool status in admin panel\n');
    } else {
        console.log('❌ SOME TIERS FAILED\n');
        console.log('Please check the errors above and try again.\n');
    }

    // Check pool status
    console.log('📊 Checking final pool status...\n');
    try {
        const statusRes = await fetch(`${PRODUCTION_URL}/api/admin/auto-setup`);
        const status = await statusRes.json();

        if (status.success) {
            console.log(`Total coupons available: ${status.totalCoupons}`);
            console.log(`Configured tiers: ${status.configuredTiers.join(', ')}`);
            if (status.missingTiers.length > 0) {
                console.log(`Missing tiers: ${status.missingTiers.join(', ')}`);
            }
        }
    } catch (error) {
        console.log('(Could not fetch pool status)');
    }

    console.log('\n✨ Setup complete!\n');
}

main().catch(console.error);
