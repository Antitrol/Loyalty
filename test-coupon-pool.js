/**
 * Test Coupon Pool System
 * Verifies that coupon pools are configured and accessible
 */

const { config } = require('dotenv');
config();

const { AuthTokenManager } = require('./src/models/auth-token/manager');
const { getIkas } = require('./src/helpers/api-helpers');
const { prisma } = require('./src/lib/prisma');

async function testCouponPool() {
    console.log("🧪 Testing Coupon Pool System\n");

    try {
        // 1. Get auth token
        const tokens = await AuthTokenManager.list();
        if (!tokens.length) {
            console.error("❌ No auth tokens found");
            return;
        }

        const client = getIkas(tokens[0]);
        console.log("✅ Auth token loaded\n");

        // 2. Get campaign IDs
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            console.error("❌ No loyalty settings found. Run create-campaigns.ts first.");
            return;
        }

        console.log("📊 Campaign Configuration:");
        console.log(`  100 points:  ${settings.campaign100Id || 'NOT SET'}`);
        console.log(`  250 points:  ${settings.campaign250Id || 'NOT SET'}`);
        console.log(`  500 points:  ${settings.campaign500Id || 'NOT SET'}`);
        console.log(`  1000 points: ${settings.campaign1000Id || 'NOT SET'}\n`);

        // 3. Test coupon pool manager
        const { getUnusedCouponFromCampaign, getCouponPoolStats } = require('./src/lib/loyalty/coupon-pool');

        const testTiers = [
            { points: 100, id: settings.campaign100Id },
            { points: 250, id: settings.campaign250Id },
            { points: 500, id: settings.campaign500Id },
            { points: 1000, id: settings.campaign1000Id }
        ].filter(t => t.id);

        for (const tier of testTiers) {
            console.log(`\n🔍 Testing ${tier.points} points tier (${tier.id})...`);

            // Get pool stats
            const stats = await getCouponPoolStats(client, tier.id);

            if (!stats) {
                console.log(`  ❌ Could not fetch pool stats`);
                continue;
            }

            console.log(`  📊 Pool Stats:`);
            console.log(`     Total: ${stats.total}`);
            console.log(`     Available: ${stats.available}`);
            console.log(`     Used: ${stats.used}`);

            if (stats.total === 0) {
                console.log(`  ⚠️  EMPTY POOL - Need to generate coupons in admin panel!`);
                continue;
            }

            // Try to fetch a coupon
            console.log(`  🎫 Fetching unused coupon...`);
            const coupon = await getUnusedCouponFromCampaign(client, tier.id);

            if (coupon) {
                console.log(`  ✅ SUCCESS: Got coupon "${coupon}"`);
            } else {
                console.log(`  ❌ FAILED: No unused coupons available`);
            }
        }

        console.log("\n\n📋 Test Summary:");
        console.log("================");

        const hasEmptyPools = testTiers.some(async (tier) => {
            const stats = await getCouponPoolStats(client, tier.id);
            return stats && stats.total === 0;
        });

        if (testTiers.length === 0) {
            console.log("❌ No campaigns configured");
            console.log("   → Run: npx tsx create-campaigns.ts");
        } else {
            console.log("✅ Campaigns configured");
            console.log("\nNext Steps:");
            console.log("1. Go to İKAS Admin Panel");
            console.log("2. For each campaign, generate 5000 coupons");
            console.log("3. Re-run this test to verify");
            console.log("4. Test redemption flow");
        }

    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testCouponPool()
    .then(() => {
        console.log("\n✅ Test completed\n");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n❌ Fatal error:", err);
        process.exit(1);
    });
