/**
 * Direct database check - what's actually in the coupon pool?
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

async function directDatabaseCheck() {
    console.log('🔍 DIRECT DATABASE INSPECTION\n');

    // We'll call a diagnostic endpoint
    // But first, let's understand the data structure

    console.log('Checking coupon pool grouping...\n');

    const campaigns = {
        100: '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0',
        250: '95f1d418-1ed1-4a6c-8cac-d66a25499518',
        500: '2ef154c7-659a-466c-a8f7-27eb8cd1a099',
        1000: '36e6cc8b-b24e-4db2-b8aa-0e5e650de983'
    };

    // Try syncing again with correct parameters
    console.log('Attempting to sync 250 points tier as test...\n');

    try {
        const syncRes = await fetch(`${PRODUCTION_URL}/api/admin/sync-coupons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId: campaigns[250],
                tier: 250,
                limit: 100
            })
        });

        const syncResult = await syncRes.json();
        console.log('Sync Result:', JSON.stringify(syncResult, null, 2));

    } catch (error) {
        console.error('Sync error:', error.message);
    }
}

directDatabaseCheck();
