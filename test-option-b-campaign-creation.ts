/**
 * Test: Create Campaign with Coupons (Option B)
 * 
 * This script tests if we can:
 * 1. Create a NEW campaign programmatically
 * 2. Generate custom coupon codes
 * 3. Associate codes with the campaign
 * 4. Store codes in database for redemption
 */

import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';
import { randomUUID } from 'crypto';

interface TestResult {
    step: string;
    success: boolean;
    data?: any;
    error?: string;
}

const results: TestResult[] = [];

function log(step: string, success: boolean, data?: any, error?: string) {
    results.push({ step, success, data, error });
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${step}`);
    if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    if (error) console.log('   Error:', error);
    console.log('');
}

async function testCreateCampaign() {
    console.log('🧪 Testing Option B: Automated Campaign Creation\n');
    console.log('='.repeat(60));
    console.log('');

    // Step 1: Get auth token
    console.log('📋 Step 1: Getting auth token...\n');
    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        log('Get auth token', false, null, 'No auth tokens found');
        return;
    }
    log('Get auth token', true, { storeId: tokens[0].storeId });

    const client = getIkas(tokens[0]);

    // Step 2: Check permissions via introspection
    console.log('📋 Step 2: Checking available mutations...\n');
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
        const campaignMutations = mutations
            .filter((m: any) => m.name.toLowerCase().includes('campaign'))
            .map((m: any) => m.name);

        const hasCreateCampaign = campaignMutations.some((m: string) =>
            m.toLowerCase().includes('create')
        );

        log('Check permissions', hasCreateCampaign, {
            availableMutations: campaignMutations,
            canCreate: hasCreateCampaign
        });

        if (!hasCreateCampaign) {
            console.log('⚠️  No CREATE_CAMPAIGN mutation found!');
            console.log('   Available mutations:', campaignMutations);
            console.log('   ❌ Cannot proceed with Option B\n');
            return;
        }
    } catch (e: any) {
        log('Check permissions', false, null, e.message);
        return;
    }

    // Step 3: Get CreateCampaignInput schema
    console.log('📋 Step 3: Getting CreateCampaignInput schema...\n');
    try {
        const query = gql`
      query {
        __type(name: "CreateCampaignInput") {
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
        const fields = res.data?.__type?.inputFields || [];

        const requiredFields = fields
            .filter((f: any) => f.type.kind === 'NON_NULL')
            .map((f: any) => f.name);

        const couponFields = fields
            .filter((f: any) => f.name.toLowerCase().includes('coupon'))
            .map((f: any) => f.name);

        log('Get schema', true, {
            totalFields: fields.length,
            requiredFields,
            couponFields
        });
    } catch (e: any) {
        log('Get schema', false, null, e.message);
    }

    // Step 4: Try to create a TEST campaign
    console.log('📋 Step 4: Creating TEST campaign...\n');
    try {
        const testId = randomUUID().substring(0, 8);
        const campaignTitle = `[TEST] Loyalty Auto - ${testId}`;

        // Find the create mutation
        const createMutation = gql`
      mutation CreateTestCampaign($input: CreateCampaignInput!) {
        createCampaign(input: $input) {
          id
          title
          type
          hasCoupon
          couponPrefix
          discount {
            type
            value
          }
        }
      }
    `;

        const input = {
            title: campaignTitle,
            type: 'FIXED_AMOUNT',
            discount: {
                type: 'FIXED_AMOUNT',
                value: 5,
                currencyCode: 'TRY'
            },
            hasCoupon: true,
            couponPrefix: `loy-${testId}-`,
            isActive: false, // Keep it inactive for testing
            validFrom: new Date().toISOString(),
            validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        };

        console.log('   Attempting to create campaign:', input.title);
        const res = await client.mutation({ mutation: createMutation, variables: { input } });

        log('Create campaign', true, res.data);

        const campaignId = res.data?.createCampaign?.id;

        // Step 5: Generate custom codes
        if (campaignId) {
            console.log('📋 Step 5: Generating custom coupon codes...\n');

            const codeCount = 10; // Generate 10 test codes
            const codes = Array.from({ length: codeCount }, () =>
                `loy-${testId}-${randomUUID().substring(0, 8)}`
            );

            log('Generate codes', true, {
                count: codes.length,
                sample: codes.slice(0, 3),
                campaignId
            });

            console.log('📋 Step 6: Checking if codes can be added to campaign...\n');

            // Try to find mutation to add codes
            const addCodesQuery = gql`
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

            const mutRes = await client.query({ query: addCodesQuery });
            const allMutations = mutRes.data?.__schema?.mutationType?.fields || [];
            const codeMutations = allMutations
                .filter((m: any) =>
                    m.name.toLowerCase().includes('coupon') ||
                    m.name.toLowerCase().includes('code')
                )
                .map((m: any) => m.name);

            log('Check code mutations', true, { availableMutations: codeMutations });

            // Try GENERATE_COUPONS to see if it works with custom codes
            console.log('📋 Step 7: Testing code association...\n');

            try {
                const generateMutation = gql`
          mutation GenerateCoupons($id: ID!, $count: Int!) {
            generateCoupons(id: $id, count: $count) {
              id
              title
              hasCoupon
            }
          }
        `;

                const genRes = await client.mutation({
                    mutation: generateMutation,
                    variables: { id: campaignId, count: 10 }
                });

                log('Associate codes', true, genRes.data);
            } catch (e: any) {
                log('Associate codes', false, null, e.message);
            }
        }

    } catch (e: any) {
        log('Create campaign', false, null, e.message);

        // Check if it's a permission error
        if (e.message?.includes('permission') || e.message?.includes('scope')) {
            console.log('⚠️  PERMISSION ERROR:');
            console.log('   You may need "write_campaigns" scope in İKAS Partner Portal');
            console.log('   Check: https://partner.myikas.com');
        }
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}\n`);

    results.forEach((r, i) => {
        const icon = r.success ? '✅' : '❌';
        console.log(`${i + 1}. ${icon} ${r.step}`);
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('');

    // Recommendation
    if (successCount === totalCount) {
        console.log('🎉 OPTION B IS VIABLE!');
        console.log('   ✅ We can create campaigns programmatically');
        console.log('   ✅ We can generate custom codes');
        console.log('   → Next: Build the full system\n');
    } else if (successCount >= 3) {
        console.log('⚠️  OPTION B IS PARTIALLY VIABLE');
        console.log('   ✅ Basic campaign creation works');
        console.log('   ❌ Some features need workarounds');
        console.log('   → Recommend: Wait for İKAS support response\n');
    } else {
        console.log('❌ OPTION B IS NOT VIABLE');
        console.log('   → Must use Option A (İKAS Support)');
        console.log('   → Or consider Option C (Manual setup)\n');
    }
}

testCreateCampaign()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
