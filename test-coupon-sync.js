/**
 * Test Coupon Sync
 * Tests the new LIST_COUPONS integration
 */

const campaignId = 'e1c8b86e-cf9b-4686-9e01-d639325784b2'; // Test campaign ID
const tier = 100;

console.log('🧪 Testing Coupon Sync...\n');

// Test sync endpoint
fetch('http://localhost:3000/api/admin/sync-coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        campaignId,
        tier,
        limit: 50
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Sync Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log(`\n📊 Stats:`);
            console.log(`   Synced: ${data.synced} coupons`);
            console.log(`   Pool Total: ${data.poolStats.total}`);
            console.log(`   Pool Available: ${data.poolStats.available}`);
            console.log(`   Pool Used: ${data.poolStats.used}`);
        }
    })
    .catch(err => {
        console.error('❌ Test Failed:', err.message);
    });
