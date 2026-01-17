/**
 * Setup Additional Tiers (250, 500, 1000 points)
 * 
 * To use this script:
 * 1. Go to İKAS Admin Panel
 * 2. Open campaign pages for each tier
 * 3. Get campaign IDs from URLs
 * 4. Update the CAMPAIGN_IDS below
 * 5. Run: node setup-tiers.js
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

// UPDATE THESE WITH YOUR İKAS CAMPAIGN IDs
const CAMPAIGN_IDS = {
    250: 'YOUR_250_CAMPAIGN_ID',  // 2.5 TL discount
    500: 'YOUR_500_CAMPAIGN_ID',  // 5 TL discount
    1000: 'YOUR_1000_CAMPAIGN_ID' // 10 TL discount
};

async function setupTier(tier, campaignId) {
    console.log(`\n📦 Setting up ${tier} points tier...`);
    console.log(`   Campaign ID: ${campaignId}`);

    // Step 1: Set campaign ID in settings
    console.log(`\n   Step 1: Saving campaign ID to database...`);
    const setCampaignResponse = await fetch(`${PRODUCTION_URL}/api/admin/set-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, campaignId })
    });

    const setCampaignResult = await setCampaignResponse.json();
    if (!setCampaignResult.success) {
        console.error(`   ❌ Failed to set campaign:`, setCampaignResult.error);
        return false;
    }
    console.log(`   ✅ Campaign ID saved`);

    // Step 2: Sync coupons from İKAS
    console.log(`\n   Step 2: Syncing 1,000 coupons from İKAS...`);
    const syncResponse = await fetch(`${PRODUCTION_URL}/api/admin/sync-coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            campaignId,
            tier,
            limit: 1000
        })
    });

    const syncResult = await syncResponse.json();
    if (!syncResult.success) {
        console.error(`   ❌ Sync failed:`, syncResult.error);
        return false;
    }

    console.log(`   ✅ Synced ${syncResult.synced} coupons`);
    console.log(`   📊 Pool stats:`, syncResult.poolStats);

    return true;
}

async function main() {
    console.log('🚀 TIER SETUP WIZARD\n');
    console.log('This will setup 250, 500, and 1000 point tiers\n');

    // Validate campaign IDs are set
    const invalidCampaigns = Object.entries(CAMPAIGN_IDS).filter(([_, id]) => id.startsWith('YOUR_'));
    if (invalidCampaigns.length > 0) {
        console.error('❌ ERROR: Please update CAMPAIGN_IDS in this script first!');
        console.error('   Missing:');
        invalidCampaigns.forEach(([tier, _]) => {
            console.error(`   - ${tier} points tier`);
        });
        console.error('\nTo get campaign IDs:');
        console.error('1. Go to İKAS Admin Panel → Marketing → Campaigns');
        console.error('2. Find campaigns for each discount value:');
        console.error('   - 2.5 TL (250 points)');
        console.error('   - 5 TL (500 points)');
        console.error('   - 10 TL (1000 points)');
        console.error('3. Click each campaign and copy ID from URL');
        console.error('4. Update CAMPAIGN_IDS in this script\n');
        return;
    }

    // Setup each tier
    const results = {};
    for (const [tier, campaignId] of Object.entries(CAMPAIGN_IDS)) {
        const success = await setupTier(parseInt(tier), campaignId);
        results[tier] = success;
    }

    // Summary
    console.log('\n\n=== SETUP SUMMARY ===\n');
    let allSuccess = true;
    for (const [tier, success] of Object.entries(results)) {
        console.log(`${success ? '✅' : '❌'} ${tier} points tier: ${success ? 'Ready' : 'Failed'}`);
        if (!success) allSuccess = false;
    }

    if (allSuccess) {
        console.log('\n🎉 ALL TIERS SUCCESSFULLY CONFIGURED!');
        console.log('\nYou now have:');
        console.log('  ✅ 100 points → 1 TL (already configured)');
        console.log('  ✅ 250 points → 2.5 TL');
        console.log('  ✅ 500 points → 5 TL');
        console.log('  ✅ 1000 points → 10 TL');
        console.log('\n📋 Next steps:');
        console.log('  1. Test redemption with 250, 500, 1000 points');
        console.log('  2. Update widget UI to show all tier options');
        console.log('  3. Run pool replenishment test\n');
    } else {
        console.log('\n❌ Some tiers failed to setup. Review errors above.\n');
    }
}

main().catch(console.error);
