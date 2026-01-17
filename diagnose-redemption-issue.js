/**
 * DIAGNOSTIC: Database Pool Investigation
 * Find out why pool queries return 0
 */

const PRODUCTION_URL = 'https://loyalty-8isa.vercel.app';

async function investigateDatabase() {
    console.log('🔍 DATABASE POOL INVESTIGATION\n');
    console.log('='.repeat(60));

    console.log('\n1. Checking raw coupon data structure...\n');

    try {
        // We need to create a diagnostic endpoint or check directly
        // Let's try to get some sample coupons

        const campaigns = {
            100: '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0',
            250: '95f1d418-1ed1-4a6c-8cac-d66a25499518',
            500: '2ef154c7-659a-466c-a8f7-27eb8cd1a099',
            1000: '36e6cc8b-b24e-4db2-b8aa-0e5e650de983'
        };

        console.log('Campaign IDs we expect:');
        Object.entries(campaigns).forEach(([tier, id]) => {
            console.log(`  ${tier} points: ${id}`);
        });

        console.log('\n2. Testing redemption endpoint directly...\n');

        // Create a test customer
        const testCustomerId = 'diagnostic-test-' + Date.now();

        console.log(`Creating test customer: ${testCustomerId}`);
        console.log('Adding 150 points...\n');

        // We'll need to test via the widget endpoint
        console.log('Test redemption payload:');
        const redeemPayload = {
            customerId: testCustomerId,
            pointsToRedeem: 100
        };
        console.log(JSON.stringify(redeemPayload, null, 2));

        console.log('\nAttempting redemption...');
        const redeemRes = await fetch(`${PRODUCTION_URL}/api/widget/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(redeemPayload)
        });

        const redeemResult = await redeemRes.json();

        console.log('\nRedemption Response:');
        console.log('Status:', redeemRes.status);
        console.log('Result:', JSON.stringify(redeemResult, null, 2));

        if (!redeemResult.success) {
            console.log('\n❌ REDEMPTION FAILED!');
            console.log('Error:', redeemResult.error);
            console.log('\nThis confirms the pool issue!');
        } else {
            console.log('\n✅ Redemption succeeded!');
            console.log('Coupon code:', redeemResult.code);
        }

    } catch (error) {
        console.error('Investigation error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Investigation complete.');
}

investigateDatabase();
