/**
 * Simple test to verify campaign coupon system
 * Tests actual redemption flow to identify the issue
 */

const { config } = require('dotenv');
config();

async function testRedemption() {
    console.log("🧪 Testing Actual Redemption Flow\n");

    try {
        // Use fetch to call the API directly
        const testCustomerId = "test-customer-id"; // Replace with actual customer ID
        const pointsToRedeem = 500;

        console.log(`📝 Test Parameters:`);
        console.log(`   Customer ID: ${testCustomerId}`);
        console.log(`   Points to Redeem: ${pointsToRedeem}\n`);

        console.log("🔄 Calling /api/loyalty/redeem...\n");

        const response = await fetch('http://localhost:3000/api/loyalty/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId: testCustomerId,
                pointsToRedeem: pointsToRedeem
            })
        });

        const result = await response.json();

        console.log("📊 API Response:");
        console.log(JSON.stringify(result, null, 2));
        console.log("");

        if (result.success) {
            console.log("✅ SUCCESS!");
            console.log(`   Coupon Code: ${result.code}`);
            console.log(`   Points Redeemed: ${result.pointsRedeemed}`);
            console.log(`   Remaining Points: ${result.remainingPoints}\n`);

            console.log("🎫 Now test this code in checkout:");
            console.log(`   Code: ${result.code}`);
        } else {
            console.log("❌ FAILED!");
            console.log(`   Error: ${result.message}\n`);

            if (result.message.includes('No unused coupons')) {
                console.log("💡 DIAGNOSIS: Coupon pool is empty or not generated");
                console.log("   → Check İKAS Admin Panel → Campaigns → [Campaign] → Coupons");
                console.log("   → Verify 'Total Coupons' count is > 0\n");
            } else if (result.message.includes('Campaign not configured')) {
                console.log("💡 DIAGNOSIS: Campaign not set up in database");
                console.log("   → Run: npx tsx create-campaigns.ts\n");
            } else if (result.message.includes('Insufficient points')) {
                console.log("💡 DIAGNOSIS: Customer doesn't have enough points");
                console.log("   → Add points to customer first\n");
            } else {
                console.log("💡 Unknown error - check logs above\n");
            }
        }

    } catch (error) {
        console.error("❌ Test Error:", error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log("\n💡 DIAGNOSIS: Server not running");
            console.log("   → Start dev server: npm run dev\n");
        }
    }
}

// Check if server is likely running
console.log("Checking development server...\n");

testRedemption()
    .then(() => {
        console.log("\n✅ Test complete\n");
    })
    .catch(err => {
        console.error("\n❌ Fatal error:", err.message);
    });
