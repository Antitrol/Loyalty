/**
 * Simple test script to discover how İKAS handles campaign coupons
 * Tests different approaches to adding coupons to campaigns
 */

const { config } = require('dotenv');
config();

const { AuthTokenManager } = require('./src/models/auth-token/manager');
const { getIkas } = require('./src/helpers/api-helpers');
const { gql } = require('graphql-request');

async function testCouponMethods() {
    console.log("🧪 Testing İKAS Coupon Methods...\n");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No auth tokens");
        return;
    }

    const client = getIkas(tokens[0]);

    // Test 1: Check if we can query campaign with coupons
    console.log("📋 Test 1: Query campaign with coupons...");
    try {
        const query = gql`
      query GetCampaignDetails($id: ID!) {
        campaign(id: $id) {
          id
          title
          type
          hasCoupon
        }
      }
    `;

        // Get a campaign ID from database
        const { prisma } = require('./src/lib/prisma');
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        const campaignId = settings?.campaign100Id;

        if (!campaignId) {
            console.log("⚠️ No campaign found in settings, skipping query test\n");
        } else {
            const res = await client.query({ query, variables: { id: campaignId } });
            console.log("✅ Campaign query successful:");
            console.log(JSON.stringify(res.data, null, 2));
            console.log("");
        }
    } catch (e) {
        console.log("❌ Campaign query failed:", e.message);
        console.log("");
    }

    // Test 2: Introspect just mutation names
    console.log("📋 Test 2: List all mutation names...");
    try {
        const query = gql`
      query {
        __schema {
          mutationType {
            fields {
              name
            }
          }
        }
      }
    `;

        const res = await client.query({ query });
        const mutations = res.data?.__schema?.mutationType?.fields || [];
        const couponRelated = mutations.filter(m =>
            m.name.toLowerCase().includes('coupon') ||
            m.name.toLowerCase().includes('campaign')
        );

        console.log(`✅ Found ${couponRelated.length} campaign/coupon mutations:`);
        couponRelated.forEach(m => console.log(`   - ${m.name}`));
        console.log("");
    } catch (e) {
        console.log("❌ Mutation introspection failed:", e.message);
        console.log("");
    }

    // Test 3: Try to get campaign input type details
    console.log("📋 Test 3: Get UpdateCampaignInput details...");
    try {
        const query = gql`
      query {
        __type(name: "UpdateCampaignInput") {
          name
          inputFields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    `;

        const res = await client.query({ query });
        console.log("✅ UpdateCampaignInput fields:");
        const fields = res.data?.__type?.inputFields || [];
        fields.forEach(f => {
            const typeName = f.type.ofType?.name || f.type.name || f.type.kind;
            console.log(`   - ${f.name}: ${typeName}`);
        });
        console.log("");
    } catch (e) {
        console.log("❌ Type introspection failed:", e.message);
        console.log("");
    }

    console.log("🏁 Testing complete!\n");
}

testCouponMethods()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
