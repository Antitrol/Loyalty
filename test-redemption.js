/**
 * Test Widget Redemption
 * Complete end-to-end test of coupon pool system
 */

console.log('🧪 Widget Redemption Test\n');

// Test customer ID (you can get real one from İKAS)
const customerId = 'test-customer-123';

// Step 1: Give customer 100 points
console.log('Step 1: Adding 100 points to customer...');
fetch('http://localhost:3000/api/loyalty/earn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        customerId,
        points: 100,
        metadata: { reason: 'Test', source: 'manual' }
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Points added:', data);

        // Step 2: Redeem 100 points
        console.log('\nStep 2: Redeeming 100 points...');
        return fetch('http://localhost:3000/api/widget/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId,
                pointsToRedeem: 100
            })
        });
    })
    .then(r => r.json())
    .then(data => {
        console.log('\n🎉 REDEMPTION RESULT:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ SUCCESS!');
            console.log(`   Coupon Code: ${data.code}`);
            console.log(`   Discount: ${data.discountValue} TL`);
            console.log(`   New Balance: ${data.newBalance} points`);
        }
    })
    .catch(err => console.error('❌ Error:', err));
