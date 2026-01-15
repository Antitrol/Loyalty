/**
 * İKAS GraphQL API Introspection
 * Discover the actual schema to find how to fetch campaign coupons
 */

import { getIkas } from './src/helpers/api-helpers';
import { prisma } from './src/lib/prisma';
import { gql } from 'graphql-request';

// Standard GraphQL introspection query
const INTROSPECTION_QUERY = gql`
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          description
          args {
            name
            type {
              name
              kind
            }
          }
        }
      }
      types {
        name
        kind
        description
        fields {
          name
          description
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
  }
`;

// Focused query to find Campaign and Coupon types
const FOCUSED_INTROSPECTION = gql`
  {
    __type(name: "Campaign") {
      name
      description
      fields {
        name
        description
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
        args {
          name
          type {
            name
            kind
          }
        }
      }
    }
  }
`;

async function introspectIkasAPI() {
    console.log('🔍 İKAS GraphQL API Schema Discovery\n');
    console.log('='.repeat(80) + '\n');

    try {
        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            throw new Error('❌ No auth token found');
        }

        console.log('✅ Auth token found\n');

        const ikasClient = getIkas(authToken as any);

        // Step 1: Check Campaign type
        console.log('📊 Step 1: Inspecting Campaign type structure...\n');

        try {
            const campaignType = await ikasClient.query({
                query: FOCUSED_INTROSPECTION
            });

            const fields = campaignType.data?.__type?.fields || [];

            console.log('Campaign Type Fields:');
            console.log('-'.repeat(80));

            fields.forEach((field: any) => {
                const typeName = field.type?.name || field.type?.ofType?.name || 'Unknown';
                const typeKind = field.type?.kind || field.type?.ofType?.kind || '';
                console.log(`  ${field.name.padEnd(30)} ${typeName} (${typeKind})`);

                if (field.description) {
                    console.log(`    → ${field.description}`);
                }

                // Look for coupons or codes field!
                if (field.name.toLowerCase().includes('coupon') ||
                    field.name.toLowerCase().includes('code')) {
                    console.log(`    🎯 FOUND POTENTIAL COUPONS FIELD!`);

                    if (field.args && field.args.length > 0) {
                        console.log(`    Arguments:`);
                        field.args.forEach((arg: any) => {
                            console.log(`      - ${arg.name}: ${arg.type.name}`);
                        });
                    }
                }
            });

            console.log('\n');

        } catch (error: any) {
            console.error('⚠️  Campaign type inspection failed:', error.message);
        }

        // Step 2: Search for Query fields related to campaigns
        console.log('📊 Step 2: Finding campaign queries...\n');

        const QUERY_FIELDS = gql`
          {
            __schema {
              queryType {
                fields {
                  name
                  description
                  args {
                    name
                    type {
                      name
                    }
                  }
                  type {
                    name
                    ofType {
                      name
                    }
                  }
                }
              }
            }
          }
        `;

        try {
            const queryResult = await ikasClient.query({
                query: QUERY_FIELDS
            });

            const queryFields = queryResult.data?.__schema?.queryType?.fields || [];

            console.log('Available Query Fields (Campaign/Discount related):');
            console.log('-'.repeat(80));

            queryFields
                .filter((f: any) =>
                    f.name.toLowerCase().includes('campaign') ||
                    f.name.toLowerCase().includes('discount') ||
                    f.name.toLowerCase().includes('coupon')
                )
                .forEach((field: any) => {
                    console.log(`\n  📌 ${field.name}`);
                    if (field.description) {
                        console.log(`     ${field.description}`);
                    }

                    if (field.args && field.args.length > 0) {
                        console.log(`     Arguments:`);
                        field.args.forEach((arg: any) => {
                            console.log(`       - ${arg.name}: ${arg.type.name}`);
                        });
                    }

                    const returnType = field.type?.name || field.type?.ofType?.name;
                    console.log(`     Returns: ${returnType}`);
                });

            console.log('\n');

        } catch (error: any) {
            console.error('⚠️  Query fields inspection failed:', error.message);
        }

        // Step 3: Try to fetch an actual campaign with coupons
        console.log('📊 Step 3: Testing actual campaign coupon fetch...\n');

        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        const campaignId = settings?.campaign100Id;

        if (campaignId) {
            console.log(`Testing with campaign ID: ${campaignId}\n`);

            // Try multiple query structures based on research
            const testQueries = [
                {
                    name: 'Research suggestion (edges/nodes)',
                    query: gql`
                        query GetCampaignCoupons($id: ID!) {
                            campaign(id: $id) {
                                id
                                title
                                configuration {
                                    ... on DiscountCodeConfiguration {
                                        codes(first: 10) {
                                            edges {
                                                node {
                                                    code
                                                    usageCount
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `
                },
                {
                    name: 'Simple codes field',
                    query: gql`
                        query GetCampaignCoupons($id: ID!) {
                            campaign(id: $id) {
                                id
                                title
                                codes {
                                    code
                                    usageCount
                                }
                            }
                        }
                    `
                },
                {
                    name: 'Coupons field',
                    query: gql`
                        query GetCampaignCoupons($id: ID!) {
                            campaign(id: $id) {
                                id
                                title
                                coupons {
                                    code
                                }
                            }
                        }
                    `
                }
            ];

            for (const test of testQueries) {
                console.log(`\n🧪 Trying: ${test.name}...`);

                try {
                    const result = await ikasClient.query({
                        query: test.query,
                        variables: { id: campaignId }
                    });

                    if (result.errors) {
                        console.log(`   ❌ Error: ${result.errors[0].message}`);
                    } else {
                        console.log(`   ✅ SUCCESS!`);
                        console.log(`   Response:`, JSON.stringify(result.data, null, 2));

                        // If we got codes, save them!
                        const codes = extractCodes(result.data);
                        if (codes.length > 0) {
                            console.log(`\n   🎉 Found ${codes.length} coupon codes!`);
                            codes.slice(0, 5).forEach(c => console.log(`      - ${c}`));

                            // Save to file
                            const fs = require('fs');
                            fs.writeFileSync('discovered-coupons.json', JSON.stringify({
                                query: test.name,
                                campaignId,
                                codes
                            }, null, 2));

                            console.log(`\n   💾 Saved to discovered-coupons.json`);
                        }

                        break; // Found working query!
                    }
                } catch (error: any) {
                    console.log(`   ❌ Failed: ${error.message}`);
                }
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Introspection Complete\n');

    } catch (error: any) {
        console.error('\n❌ Fatal Error:', error.message);
        console.error(error.stack);
    }
}

function extractCodes(data: any): string[] {
    const codes: string[] = [];

    // Try different paths
    if (data?.campaign?.codes) {
        if (Array.isArray(data.campaign.codes)) {
            codes.push(...data.campaign.codes.map((c: any) => c.code));
        }
    }

    if (data?.campaign?.coupons) {
        if (Array.isArray(data.campaign.coupons)) {
            codes.push(...data.campaign.coupons.map((c: any) => c.code));
        }
    }

    if (data?.campaign?.configuration?.codes?.edges) {
        codes.push(...data.campaign.configuration.codes.edges.map((e: any) => e.node.code));
    }

    return codes.filter(Boolean);
}

introspectIkasAPI();
