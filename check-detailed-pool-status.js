/**
 * Check detailed pool status with correct campaign IDs
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

const CAMPAIGNS = {
    100: '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0',
    250: '95f1d418-1ed1-4a6c-8cac-d66a25499518',
    500: '2ef154c7-659a-466c-a8f7-27eb8cd1a099',
    1000: '36e6cc8b-b24e-4db2-b8aa-0e5e650de983'
};

async function checkDetailedStatus() {
    console.log('📊 DETAILED POOL STATUS CHECK\n');
    console.log('Campaign IDs:');
    Object.entries(CAMPAIGNS).forEach(([tier, id]) => {
        console.log(`  ${tier} points: ${id}`);
    });
    console.log('\n---\n');

    for (const [tier, campaignId] of Object.entries(CAMPAIGNS)) {
        console.log(`\n🔍 Checking ${tier} points tier...`);

        try {
            const response = await fetch(
                `${PRODUCTION_URL}/api/admin/sync-coupons?campaignId=${campaignId}&tier=${tier}`
            );

            const result = await response.json();

            if (result.success && result.stats) {
                console.log(`✅ Status:`);
                console.log(`   Campaign ID: ${campaignId.substring(0, 20)}...`);
                console.log(`   Available: ${result.stats.available} coupons`);
                console.log(`   Used: ${result.stats.used} coupons`);
                console.log(`   Total: ${result.stats.total} coupons`);
                console.log(`   Percentage: ${result.stats.percentage.toFixed(1)}%`);
            } else {
                console.log(`❌ Error:`, result.error || 'Unknown error');
            }
        } catch (error) {
            console.log(`❌ Request failed:`, error.message);
        }
    }

    console.log('\n\n📋 SUMMARY\n');

    // Check overall setup status
    try {
        const statusRes = await fetch(`${PRODUCTION_URL}/api/admin/auto-setup`);
        const status = await statusRes.json();

        console.log(`Setup Complete: ${status.isComplete ? '✅' : '❌'}`);
        console.log(`Total Coupons in Database: ${status.totalCoupons || 0}`);
        console.log(`Configured Tiers: ${status.configuredTiers?.join(', ') || 'None'}`);

        if (status.missingTiers?.length > 0) {
            console.log(`⚠️  Missing Tiers: ${status.missingTiers.join(', ')}`);
        }
    } catch (error) {
        console.log('Could not fetch summary:', error.message);
    }

    console.log('\n✨ Check complete!\n');
}

checkDetailedStatus();
