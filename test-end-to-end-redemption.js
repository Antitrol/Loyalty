/**
 * End-to-End Redemption Test
 * Tests complete redemption flow from customer points to coupon code
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'https://loyalty-8isa.vercel.app';
const TEST_CUSTOMER_ID = 'test-e2e-customer-' + Date.now();

async function testEndToEnd() {
    console.log('🧪 END-TO-END REDEMPTION TEST\n');
    console.log('Customer ID:', TEST_CUSTOMER_ID);
    console.log('---\n');

    try {
        // Step 1: Create test customer with points
        console.log('Step 1: Creating test customer with 150 points...');
        await prisma.loyaltyBalance.create({
            data: {
                customerId: TEST_CUSTOMER_ID,
                points: 150,
                totalEarned: 150,
                totalRedeemed: 0
            }
        });
        console.log('✅ Customer created\n');

        // Step 2: Check initial balance
        const initialBalance = await prisma.loyaltyBalance.findUnique({
            where: { customerId: TEST_CUSTOMER_ID }
        });
        console.log('Step 2: Initial balance:');
        console.log('   Points:', initialBalance.points);
        console.log('   Total Earned:', initialBalance.totalEarned);
        console.log('   Total Redeemed:', initialBalance.totalRedeemed);
        console.log('');

        // Step 3: Check coupon pool status
        console.log('Step 3: Checking coupon pool status...');
        const poolStats = await prisma.couponPool.groupBy({
            by: ['tier'],
            _count: { _all: true },
            where: { usedAt: null }
        });
        poolStats.forEach(s => {
            console.log(`   ${s.tier} points tier: ${s._count._all} coupons available`);
        });
        console.log('');

        // Step 4: Attempt redemption (100 points)
        console.log('Step 4: Redeeming 100 points...');
        const redeemResponse = await fetch(`${API_BASE}/api/widget/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: TEST_CUSTOMER_ID,
                pointsToRedeem: 100
            })
        });

        const redeemResult = await redeemResponse.json();
        console.log('   Response status:', redeemResponse.status);
        console.log('   Success:', redeemResult.success);

        if (!redeemResult.success) {
            console.error('❌ Redemption failed:', redeemResult.error);
            return;
        }

        console.log('   Coupon Code:', redeemResult.code);
        console.log('   Discount Value:', redeemResult.discountValue + '₺');
        console.log('   New Balance:', redeemResult.newBalance);
        console.log('✅ Redemption successful!\n');

        // Step 5: Verify database updates
        console.log('Step 5: Verifying database updates...');

        // Check balance
        const updatedBalance = await prisma.loyaltyBalance.findUnique({
            where: { customerId: TEST_CUSTOMER_ID }
        });
        console.log('   Updated Points:', updatedBalance.points, '(expected: 50)');
        console.log('   Match:', updatedBalance.points === 50 ? '✅' : '❌');

        // Check transaction log
        const transaction = await prisma.loyaltyTransaction.findFirst({
            where: {
                customerId: TEST_CUSTOMER_ID,
                type: 'REDEEM'
            }
        });
        console.log('   Transaction logged:', transaction ? '✅' : '❌');
        if (transaction) {
            console.log('   Transaction points:', transaction.points);
            console.log('   Coupon code in metadata:', transaction.metadata?.code);
        }

        // Check coupon marked as used
        const usedCoupon = await prisma.couponPool.findUnique({
            where: { code: redeemResult.code }
        });
        console.log('   Coupon marked as used:', usedCoupon?.usedAt ? '✅' : '❌');
        console.log('   Used by:', usedCoupon?.usedBy);
        console.log('');

        // Step 6: Summary
        console.log('=== TEST SUMMARY ===');
        const success =
            updatedBalance.points === 50 &&
            transaction !== null &&
            usedCoupon?.usedAt !== null &&
            usedCoupon?.usedBy === TEST_CUSTOMER_ID;

        if (success) {
            console.log('🎉 ALL TESTS PASSED!');
            console.log('\n✨ E2E Flow is working perfectly:');
            console.log('   ✅ Customer balance deducted');
            console.log('   ✅ Transaction logged');
            console.log('   ✅ Coupon marked as used');
            console.log('   ✅ Coupon code returned to customer');
            console.log('\n📋 Next: Test this coupon at İKAS checkout!');
            console.log('   Coupon Code:', redeemResult.code);
        } else {
            console.log('❌ SOME TESTS FAILED - Review above');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await prisma.loyaltyTransaction.deleteMany({
            where: { customerId: TEST_CUSTOMER_ID }
        });
        await prisma.loyaltyBalance.deleteMany({
            where: { customerId: TEST_CUSTOMER_ID }
        });
        console.log('✅ Cleanup complete');

        await prisma.$disconnect();
    }
}

// Run test
testEndToEnd().catch(console.error);
