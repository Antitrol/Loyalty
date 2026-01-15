/**
 * Fetch Coupons from İKAS Campaign
 * Use this to get existing coupon codes from İKAS for import
 */

import { getIkas } from './src/helpers/api-helpers';
import { prisma } from './src/lib/prisma';
import { gql } from 'graphql-request';

const GET_CAMPAIGN_COUPONS = gql`
  query GetCampaignCoupons($campaignId: ID!, $limit: Int) {
    campaign(id: $campaignId) {
      id
      title
      coupons(limit: $limit) {
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

async function fetchCouponsFromIkas() {
    console.log('🔍 Fetching coupons from İKAS campaigns...\n');

    try {
        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            throw new Error('No auth token found');
        }

        // Get campaign IDs
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            throw new Error('No loyalty settings found');
        }

        const tiers = [
            { points: 100, campaignId: settings.campaign100Points },
            { points: 250, campaignId: settings.campaign250Points },
            { points: 500, campaignId: settings.campaign500Points },
            { points: 1000, campaignId: settings.campaign1000Points }
        ];

        const ikasClient = getIkas(authToken as any);

        console.log('📊 Attempting to fetch coupons for each tier:\n');

        for (const tier of tiers) {
            if (!tier.campaignId) {
                console.log(`⚠️  Tier ${tier.points}: No campaign ID configured`);
                continue;
            }

            try {
                console.log(`🎯 Tier ${tier.points} points (Campaign: ${tier.campaignId})`);

                const result = await ikasClient.query({
                    query: GET_CAMPAIGN_COUPONS,
                    variables: {
                        campaignId: tier.campaignId,
                        limit: 100 // Fetch first 100 to test
                    }
                });

                const coupons = result.data?.campaign?.coupons?.data || [];
                const total = result.data?.campaign?.coupons?.total || 0;
                const title = result.data?.campaign?.title || 'Unknown';

                console.log(`   Campaign Title: ${title}`);
                console.log(`   Total Coupons: ${total}`);
                console.log(`   Fetched: ${coupons.length}`);

                if (coupons.length > 0) {
                    console.log(`   Sample codes:`);
                    coupons.slice(0, 5).forEach((c: any) => {
                        console.log(`      - ${c.code} (used: ${c.usageCount}/${c.usageLimit || '∞'})`);
                    });

                    // Save codes to file for import
                    const fs = require('fs');
                    const filename = `coupons-tier-${tier.points}.txt`;
                    const codes = coupons.map((c: any) => c.code).join('\n');
                    fs.writeFileSync(filename, codes);
                    console.log(`   ✅ Saved to ${filename}`);
                }

                console.log('');

            } catch (error: any) {
                console.error(`   ❌ Error: ${error.message}`);
                console.log('');
            }
        }

        console.log('\n📝 Summary:');
        console.log('If coupons were fetched successfully, you can now:');
        console.log('1. Check the generated .txt files');
        console.log('2. Use them with the import-coupons-helper.ts script');
        console.log('3. Or manually call /api/admin/import-coupons endpoint');

    } catch (error: any) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
    }
}

fetchCouponsFromIkas();
