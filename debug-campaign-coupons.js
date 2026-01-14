/**
 * Quick debug script to check campaign coupons
 */
const { config } = require('dotenv');
config();

const { gql, GraphQLClient } = require('graphql-request');

async function debugCampaign() {
    try {
        // Hardcoded campaign ID from error message
        const campaignId = "2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0";

        // Get access token from database
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            console.error("❌ No auth token found");
            await prisma.$disconnect();
            return;
        }

        // Create GraphQL client
        const client = new GraphQLClient('https://admin-gateway.myikas.com/admin/graphql', {
            headers: {
                authorization: `Bearer ${authToken.accessToken}`,
                'x-ikas-app-id': authToken.storeId
            }
        });

        // Query campaign coupons
        const query = gql`
      query GetCampaignCoupons($campaignId: ID!, $limit: Int, $offset: Int) {
        campaign(id: $campaignId) {
          id
          title
          hasCoupon
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

        console.log(`\n🔍 Querying campaign: ${campaignId}\n`);

        const result = await client.request(query, {
            campaignId,
            limit: 10,
            offset: 0
        });

        console.log("📊 Campaign Details:");
        console.log(JSON.stringify(result, null, 2));

        if (result.campaign) {
            console.log(`\n✅ Campaign found: ${result.campaign.title}`);
            console.log(`   Has Coupon: ${result.campaign.hasCoupon}`);
            console.log(`   Total Coupons: ${result.campaign.coupons?.total || 0}`);

            if (result.campaign.coupons?.data?.length > 0) {
                console.log(`\n📋 Sample Coupons:`);
                result.campaign.coupons.data.forEach((c, i) => {
                    console.log(`   ${i + 1}. ${c.code} - Used: ${c.usageCount}/${c.usageLimit}`);
                });
            } else {
                console.log(`\n❌ No coupons found in pool!`);
            }
        } else {
            console.log(`\n❌ Campaign not found with ID: ${campaignId}`);
        }

        await prisma.$disconnect();

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        if (error.response) {
            console.error("Response:", JSON.stringify(error.response, null, 2));
        }
    }
}

debugCampaign();
