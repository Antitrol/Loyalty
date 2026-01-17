/**
 * Quick check: See if campaign IDs were saved to database
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

async function checkStatus() {
    console.log('🔍 Checking setup status...\n');

    try {
        const response = await fetch(`${PRODUCTION_URL}/api/admin/auto-setup`);
        const result = await response.json();

        if (!result.success) {
            console.log('❌ Error:', result.error);
            return;
        }

        console.log('📊 SETUP STATUS:\n');
        console.log(`Setup Complete: ${result.isComplete ? '✅ YES' : '❌ NO'}`);
        console.log(`Total Coupons: ${result.totalCoupons}`);
        console.log(`\nConfigured Tiers: ${result.configuredTiers.join(', ') || 'None'}`);
        console.log(`Missing Tiers: ${result.missingTiers.join(', ') || 'None'}`);

        console.log('\n---\n');

        // Check each tier
        const tiers = [100, 250, 500, 1000];
        for (const tier of tiers) {
            const poolRes = await fetch(
                `${PRODUCTION_URL}/api/admin/sync-coupons?campaignId=dummy&tier=${tier}`
            );
            const poolData = await poolRes.json();

            if (poolData.success && poolData.stats) {
                console.log(`${tier} points:`);
                console.log(`  Available: ${poolData.stats.available}`);
                console.log(`  Used: ${poolData.stats.used}`);
                console.log(`  Total: ${poolData.stats.total}`);
            } else {
                console.log(`${tier} points: Not configured or no data`);
            }
        }

    } catch (error) {
        console.error('Error checking status:', error.message);
    }
}

checkStatus();
