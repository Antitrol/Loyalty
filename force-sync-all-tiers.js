/**
 * FORCE SYNC ALL TIERS - Parallel execution
 * Run all 4 syncs at once to save time
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

const TIERS = [
    { tier: 100, id: '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0', discount: '1 TL' },
    { tier: 250, id: '95f1d418-1ed1-4a6c-8cac-d66a25499518', discount: '2.5 TL' },
    { tier: 500, id: '2ef154c7-659a-466c-a8f7-27eb8cd1a099', discount: '5 TL' },
    { tier: 1000, id: '36e6cc8b-b24e-4db2-b8aa-0e5e650de983', discount: '10 TL' }
];

async function syncTier(config) {
    const { tier, id, discount } = config;

    console.log(`[${tier}] Starting sync...`);
    const startTime = Date.now();

    try {
        const response = await fetch(`${PRODUCTION_URL}/api/admin/sync-coupons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId: id,
                tier: tier,
                limit: 1000
            })
        });

        const result = await response.json();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (result.success) {
            console.log(`[${tier}] ✅ DONE in ${duration}s - Synced: ${result.synced}`);
            return { tier, success: true, synced: result.synced, duration };
        } else {
            console.log(`[${tier}] ❌ FAILED in ${duration}s - ${result.error}`);
            return { tier, success: false, error: result.error, duration };
        }
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[${tier}] ❌ ERROR in ${duration}s - ${error.message}`);
        return { tier, success: false, error: error.message, duration };
    }
}

async function forceSyncAll() {
    console.log('🚀 FORCE SYNC ALL TIERS (PARALLEL)\n');
    console.log('Running all 4 syncs simultaneously...\n');

    const startTime = Date.now();

    // Run all syncs in parallel
    const results = await Promise.all(TIERS.map(syncTier));

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SYNC RESULTS');
    console.log(`${'='.repeat(60)}\n`);

    let totalSynced = 0;
    let successCount = 0;

    results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} ${r.tier} points: ${r.success ? `${r.synced} coupons` : r.error}`);
        if (r.success) {
            totalSynced += r.synced;
            successCount++;
        }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   Successful: ${successCount}/4 tiers`);
    console.log(`   Total Synced: ${totalSynced} coupons`);
    console.log(`   Total Time: ${totalDuration}s`);
    console.log('');

    if (successCount === 4) {
        console.log('🎉 ALL TIERS SYNCED SUCCESSFULLY!\n');
    }
}

forceSyncAll();
