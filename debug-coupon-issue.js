/**
 * Debug: Check campaign and coupon pool status
 * This will tell us exactly what's missing
 */

const { config } = require('dotenv');
config();

const { gql } = require('graphql-request');

async function debugCampaignStatus() {
    console.log("🔍 Debugging Campaign & Coupon Pool Status\n");

    try {
        // Load dependencies
        const { AuthTokenManager } = require('./src/models/auth-token/manager');
        const { getIkas } = require('./src/helpers/api-helpers');
        const { prisma } = require('./src/lib/prisma');

        // Get auth token
        const tokens = await AuthTokenManager.list();
        if (!tokens.length) {
            console.error("❌ No auth tokens found");
            return;
        }

        const client = getIkas(tokens[0]);
        console.log("✅ Auth token loaded\n");

        // Get campaign IDs from database
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            console.log("❌ PROBLEM FOUND: No loyalty settings in database");
            console.log("   → Solution: Run 'npx tsx create-campaigns.ts'\n");
            return;
        }

        console.log("📊 Campaign IDs in Database:");
        const campaigns = [
            { name: '100 points (1 TL)', id: settings.campaign100Id },
            { name: '250 points (2.5 TL)', id: settings.campaign250Id },
            { name: '500 points (5 TL)', id: settings.campaign500Id },
            { name: '1000 points (10 TL)', id: settings.campaign1000Id }
        ];

        campaigns.forEach(c => {
            console.log(`  ${c.name}: ${c.id || '❌ NOT SET'}`);
        });
        console.log("");

        const configuredCampaigns = campaigns.filter(c => c.id);

        if (configuredCampaigns.length === 0) {
            console.log("❌ PROBLEM FOUND: No campaigns configured");
            console.log("   → Solution: Run 'npx tsx create-campaigns.ts'\n");
            return;
        }

        // Check each campaign's coupon pool
        const GET_CAMPAIGN_DETAILS = gql`
      query GetCampaignDetails($id: ID!) {
        campaign(id: $id) {
          id
          title
          type
          hasCoupon
          coupons(limit: 5) {
            total
            data {
              code
              usageCount
              usageLimit
            }
          }
        }
      }
    `;

        console.log("🔍 Checking İKAS Campaigns...\n");

        let hasEmptyPool = false;
        let allCampaignsExist = true;

        for (const camp of configuredCampaigns) {
            console.log(`\n📌 Checking: ${camp.name}`);
            console.log(`   Campaign ID: ${camp.id}`);

            try {
                const res = await client.query({
                    query: GET_CAMPAIGN_DETAILS,
                    variables: { id: camp.id }
                });

                const campaign = res.data?.campaign;

                if (!campaign) {
                    console.log(`   ❌ PROBLEM: Campaign not found in İKAS!`);
                    console.log(`      Campaign ID ${camp.id} doesn't exist`);
                    allCampaignsExist = false;
                    continue;
                }

                console.log(`   ✅ Campaign exists: "${campaign.title}"`);
                console.log(`   ✅ Has Coupon: ${campaign.hasCoupon}`);

                const totalCoupons = campaign.coupons?.total || 0;
                const sampleCoupons = campaign.coupons?.data || [];

                console.log(`   📊 Coupon Pool: ${totalCoupons} total coupons`);

                if (totalCoupons === 0) {
                    console.log(`   ❌ PROBLEM: EMPTY COUPON POOL!`);
                    console.log(`      This campaign has NO coupons generated`);
                    hasEmptyPool = true;
                } else {
                    console.log(`   ✅ Pool has coupons`);

                    if (sampleCoupons.length > 0) {
                        console.log(`   📋 Sample coupons:`);
                        sampleCoupons.slice(0, 3).forEach(c => {
                            const used = c.usageCount || 0;
                            const limit = c.usageLimit || 1;
                            const status = used < limit ? '✅' : '❌';
                            console.log(`      ${status} ${c.code} (${used}/${limit} uses)`);
                        });
                    }
                }

            } catch (error) {
                console.log(`   ❌ ERROR querying campaign: ${error.message}`);
                if (error.response?.errors) {
                    error.response.errors.forEach(err => {
                        console.log(`      - ${err.message}`);
                    });
                }
            }
        }

        // Summary
        console.log("\n\n" + "=".repeat(60));
        console.log("📋 DIAGNOSIS SUMMARY");
        console.log("=".repeat(60) + "\n");

        if (!allCampaignsExist) {
            console.log("❌ Some campaign IDs in database don't exist in İKAS");
            console.log("   → Run: npx tsx create-campaigns.ts\n");
        }

        if (hasEmptyPool) {
            console.log("❌ ROOT CAUSE FOUND: Empty Coupon Pools!");
            console.log("   This is why coupons are invalid.\n");
            console.log("📝 SOLUTION - Manual Steps Required:\n");
            console.log("1. Open İKAS Admin Panel");
            console.log("   https://[your-store].myikas.com/admin\n");
            console.log("2. Go to: Marketing → Campaigns\n");
            console.log("3. For EACH campaign listed above:");
            console.log("   a) Click the campaign");
            console.log("   b) Go to 'Coupons' tab");
            console.log("   c) Click 'Generate Coupons'");
            console.log("   d) Enter quantity: 5000");
            console.log("   e) Usage limit: 1");
            console.log("   f) Click Generate\n");
            console.log("4. Wait for generation to complete (30-60 seconds)\n");
            console.log("5. Re-run this script to verify\n");
        } else if (allCampaignsExist && !hasEmptyPool) {
            console.log("✅ All campaigns exist and have coupon pools!");
            console.log("   The system should be working correctly.\n");
        }

        await prisma.$disconnect();

    } catch (error) {
        console.error("\n❌ Debug failed:", error.message);
        console.error(error.stack);
    }
}

debugCampaignStatus()
    .then(() => {
        console.log("\n✅ Debug complete\n");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n❌ Fatal error:", err);
        process.exit(1);
    });
