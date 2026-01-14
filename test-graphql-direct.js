/**
 * Test GraphQL Campaign Coupons Query Directly
 * To verify the schema and response structure
 */

const { GraphQLClient, gql } = require('graphql-request');
const { config } = require('dotenv');
config();

async function testDirectQuery() {
    console.log("\n🔬 Testing Campaign Coupons GraphQL Query...\n");

    const campaignId = "2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0";

    // Hardcode access token and store ID from your .env or database
    const accessToken = process.env.IKAS_ACCESS_TOKEN || "YOUR_TOKEN_HERE";
    const storeId = process.env.STORE_ID || "YOUR_STORE_ID_HERE";

    if (!accessToken || accessToken === "YOUR_TOKEN_HERE") {
        console.error("❌ Please set IKAS_ACCESS_TOKEN in script or .env");
        return;
    }

    const client = new GraphQLClient('https://admin-gateway.myikas.com/admin/graphql', {
        headers: {
            authorization: `Bearer ${accessToken}`,
            'x-ikas-app-id': storeId
        }
    });

    // Test 1: Basic campaign query
    console.log("TEST 1: Basic Campaign Info");
    const basicQuery = gql`
    query GetCampaign($id: ID!) {
      campaign(id: $id) {
        id
        title
        hasCoupon
      }
    }
  `;

    try {
        const result1 = await client.request(basicQuery, { id: campaignId });
        console.log("✅ Basic Query Result:", JSON.stringify(result1, null, 2));
    } catch (e) {
        console.error("❌ Basic query failed:", e.message);
    }

    // Test 2: Campaign with coupons
    console.log("\n\nTEST 2: Campaign with Coupons");
    const couponsQuery = gql`
    query GetCampaignCoupons($campaignId: ID!, $limit: Int, $offset: Int) {
      campaign(id: $campaignId) {
        id
        title
        coupons(limit: $limit, offset: $offset) {
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

    try {
        const result2 = await client.request(couponsQuery, {
            campaignId,
            limit: 10,
            offset: 0
        });
        console.log("✅ Coupons Query Result:", JSON.stringify(result2, null, 2));

        if (result2.campaign?.coupons) {
            console.log(`\n📊 Analysis:`);
            console.log(`   Total coupons: ${result2.campaign.coupons.total}`);
            console.log(`   Returned coupons: ${result2.campaign.coupons.data?.length || 0}`);

            if (result2.campaign.coupons.data?.length > 0) {
                console.log(`\n   Sample coupons:`);
                result2.campaign.coupons.data.slice(0, 3).forEach(c => {
                    console.log(`   - ${c.code} (${c.usageCount}/${c.usageLimit})`);
                });
            }
        }
    } catch (e) {
        console.error("❌ Coupons query failed:", e.message);
        if (e.response?.errors) {
            console.error("GraphQL Errors:", e.response.errors);
        }
    }
}

testDirectQuery();
