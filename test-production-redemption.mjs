/**
 * Direct API Test - Production Redemption
 */

// Test with production API
const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

// Step 1: Create test customer with points
async function testRedemption() {
    console.log('🧪 Testing Production Redemption\n');

    // Use a test customer ID
    const customerId = 'test-' + Date.now();

    try {
        // Step 1: Give points
        console.log('Step 1: Adding 150 points...');
        const earnResponse = await fetch(`${PRODUCTION_URL}/api/loyalty/earn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId,
                points: 150,
                orderId: 'test-order-' + Date.now(),
                metadata: { test: true }
            })
        });

        const earnData = await earnResponse.json();
        console.log('✅ Points added:', earnData);

        // Step 2: Redeem
        console.log('\nStep 2: Redeeming 100 points for coupon...');
        const redeemResponse = await fetch(`${PRODUCTION_URL}/api/widget/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId,
                pointsToRedeem: 100
            })
        });

        const redeemData = await redeemResponse.json();

        console.log('\n🎉 REDEMPTION RESULT:');
        console.log(JSON.stringify(redeemData, null, 2));

        if (redeemData.success) {
            console.log('\n✅✅✅ SUCCESS! ✅✅✅');
            console.log(`   Coupon Code: ${redeemData.code}`);
            console.log(`   Discount Value: ${redeemData.discountValue} TL`);
            console.log(`   Points Used: ${redeemData.pointsRedeemed}`);
            console.log(`   New Balance: ${redeemData.newBalance} points`);
        } else {
            console.log('\n❌ FAILED:', redeemData.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRedemption();
