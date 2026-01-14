/**
 * Investigation script: Check current campaign structure and coupon pool
 */

const { config } = require('dotenv');
config();

const { AuthTokenManager } = require('./src/models/auth-token/manager');
const { getIkas } = require('./src/helpers/api-helpers');
const { gql } = require('graphql-request');
const { prisma } = require('./src/lib/prisma');

async function investigateCampaigns() {
    console.log("🔍 Investigating İKAS Campaign & Coupon Structure\n");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No auth tokens found");
        return;
    }

    const client = getIkas(tokens[0]);

    // Get campaign IDs from database
    const settings = await prisma.loyaltySettings.findUnique({
        where: { id: 'default' }
    });

    if (!settings) {
        console.log("⚠️ No loyalty settings found in database");
        return;
    }

    console.log("📊 Campaign IDs from Database:");
    console.log(`  100 points:  ${settings.campaign100Id || 'Not set'}`);
    console.log(`  250 points:  ${settings.campaign250Id || 'Not set'}`);
    console.log(`  500 points:  ${settings.campaign500Id || 'Not set'}`);
    console.log(`  1000 points: ${settings.campaign1000Id || 'Not set'}\n`);

    const campaignIds = [
        { tier: '100', id: settings.campaign100Id },
        { tier: '250', id: settings.campaign250Id },
        { tier: '500', id: settings.campaign500Id },
        { tier: '1000', id: settings.campaign1000Id },
    ].filter(c => c.id);

    if (campaignIds.length === 0) {
        console.log("❌ No campaigns configured. Run create-campaigns.ts first.");
        return;
    }

    // Query for coupon details
    const GET_CAMPAIGN_COUPONS = gql`
    query GetCampaignCoupons($campaignId: ID!, $limit: Int, $offset: Int) {
      campaign(id: $campaignId) {
        id
        title
        type
        hasCoupon
        coupons(limit: $limit, offset: $offset) {
          data {
            code
            usageCount
            usageLimit
          }
          total
        }
      }
    }
  `;

    for (const { tier, id } of campaignIds) {
        try {
            console.log(`\n🔍 Checking ${tier} points campaign (${id})...`);

            const res = await client.query({
                query: GET_CAMPAIGN_COUPONS,
                variables: {
                    campaignId: id,
                    limit: 10,
                    offset: 0
                }
            });

            const campaign = res.data?.campaign;

            if (!campaign) {
                console.log(`  ❌ Campaign not found in İKAS`);
                continue;
            }

            console.log(`  ✅ Title: ${campaign.title}`);
            console.log(`  ✅ Type: ${campaign.type}`);
            console.log(`  ✅ Has Coupon: ${campaign.hasCoupon}`);

            const coupons = campaign.coupons?.data || [];
            const total = campaign.coupons?.total || 0;

            console.log(`  📊 Coupon Pool: ${total} total coupons`);

            if (coupons.length > 0) {
                console.log(`  📋 Sample coupons (first 3):`);
                coupons.slice(0, 3).forEach((c) => {
                    const used = c.usageCount || 0;
                    const limit = c.usageLimit || 1;
                    const status = used < limit ? '✅ Available' : '❌ Used';
                    console.log(`     - ${c.code} (${used}/${limit}) ${status}`);
                });

                const available = coupons.filter((c) =>
                    (c.usageCount || 0) < (c.usageLimit || 1)
                ).length;

                console.log(`  ✅ Available in sample: ${available}/${coupons.length}`);
            } else {
                console.log(`  ⚠️ NO COUPONS IN POOL - Manual generation needed!`);
            }

        } catch (error) {
            console.log(`  ❌ Error querying campaign: ${error.message}`);
            if (error.response?.errors) {
                error.response.errors.forEach((err) => {
                    console.log(`     - ${err.message}`);
                });
            }
        }
    }

    console.log("\n\n📋 Summary:\n");
    console.log("Next Steps:");
    console.log("1. If coupon pools are EMPTY:");
    console.log("   → Go to İKAS Admin Panel");
    console.log("   → Navigate to each campaign");
    console.log("   → Generate 5000 coupons per campaign");
    console.log("");
    console.log("2. If coupon pools EXIST:");
    console.log("   → Proceed with implementation");
    console.log("   → API will fetch from existing pool\n");
}

investigateCampaigns()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
