/**
 * Simplified İKAS Introspection - No database needed
 * Uses environment variables directly
 */

import { ikasAdminGraphQLAPIClient } from './src/lib/ikas-client/generated/graphql';
import { gql } from 'graphql-request';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const CAMPAIGN_TYPE_INTROSPECTION = gql`
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
          }
        }
      }
    }
  }
`;

async function simpleIntrospect() {
    console.log('🔍 İKAS API Introspection (Simplified)\n');
    console.log('='.repeat(80) + '\n');

    try {
        // Create İKAS client directly from env
        const client = ikasAdminGraphQLAPIClient({
            token: {
                accessToken: process.env.IKAS_APP_ACCESS_TOKEN || '',
                accountId: process.env.IKAS_APP_ACCOUNT_ID || '',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                isAccountOwner: false,
                isStaff: false,
                refreshToken: '',
                scopes: ['read_campaigns', 'write_campaigns'],
                userId: ''
            }
        });

        console.log('✅ İKAS Client created\n');

        // Test 1: Get Campaign type structure
        console.log('📊 Step 1: Inspecting Campaign type...\n');

        const result = await client.query({
            query: CAMPAIGN_TYPE_INTROSPECTION
        });

        const fields = result.data?.__type?.fields || [];

        console.log('Campaign Type Fields:');
        console.log('-'.repeat(80));

        fields.forEach((field: any) => {
            const typeName = field.type?.name || field.type?.ofType?.name || '?';
            const typeKind = field.type?.kind || field.type?.ofType?.kind || '';

            console.log(`\n  ${field.name}`);
            console.log(`    Type: ${typeName} (${typeKind})`);

            if (field.description) {
                console.log(`    Description: ${field.description}`);
            }

            // Check for coupon-related fields
            if (field.name.toLowerCase().includes('coupon') ||
                field.name.toLowerCase().includes('code')) {
                console.log(`    🎯 POTENTIAL COUPONS FIELD!`);
            }

            if (field.args && field.args.length > 0) {
                console.log(`    Arguments:`);
                field.args.forEach((arg: any) => {
                    console.log(`      - ${arg.name}: ${arg.type.name}`);
                });
            }
        });

        console.log('\n' + '='.repeat(80));

        // Test 2: Try fetching from a known campaign
        const CAMPAIGN_ID = '2bc1f3dc-8b85-4935-b30c-b28aa12b0fe0'; // 100 points campaign

        console.log(`\n📊 Step 2: Testing coupon fetch from campaign ${CAMPAIGN_ID}...\n`);

        const testQueries = [
            {
                name: 'Query 1: configuration.codes.edges',
                query: gql`
                    query GetCoupons($id: ID!) {
                        campaign(id: $id) {
                            id
                            title
                            configuration {
                                ... on DiscountCodeConfiguration {
                                    codes(first: 5) {
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
                name: 'Query 2: Simple codes array',
                query: gql`
                    query GetCoupons($id: ID!) {
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
                name: 'Query 3: coupons array',
                query: gql`
                    query GetCoupons($id: ID!) {
                        campaign(id: $id) {
                            id
                            title
                            coupons {
                                code
                            }
                        }
                    }
                `
            },
            {
                name: 'Query 4: discountCodes array',
                query: gql`
                    query GetCoupons($id: ID!) {
                        campaign(id: $id) {
                            id
                            title
                            discountCodes {
                                code
                            }
                        }
                    }
                `
            }
        ];

        for (const test of testQueries) {
            console.log(`\n🧪 ${test.name}...`);

            try {
                const result = await client.query({
                    query: test.query,
                    variables: { id: CAMPAIGN_ID }
                });

                if (result.errors) {
                    console.log(`   ❌ ${result.errors[0].message}`);
                } else {
                    console.log(`   ✅ SUCCESS!`);
                    console.log(JSON.stringify(result.data, null, 2));

                    // Save successful response
                    const fs = require('fs');
                    fs.writeFileSync('working-query.json', JSON.stringify({
                        queryName: test.name,
                        result: result.data
                    }, null, 2));

                    console.log(`   💾 Saved to working-query.json`);
                    break;
                }
            } catch (error: any) {
                console.log(`   ❌ ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Introspection Complete\n');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

simpleIntrospect();
