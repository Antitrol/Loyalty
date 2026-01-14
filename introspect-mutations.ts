/**
 * İKAS GraphQL Introspection - Campaign & Coupon Mutations
 * Discovers all mutations related to campaigns and coupons
 */

import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';
import * as fs from 'fs';

async function main() {
    console.log("🔍 Discovering Campaign & Coupon Mutations...\n");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No auth tokens found");
        return;
    }

    const client = getIkas(tokens[0]);

    // Introspect mutation types
    const query = gql`
    query IntrospectMutations {
      __schema {
        mutationType {
          fields {
            name
            description
            args {
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
            type {
              name
              kind
            }
          }
        }
      }
    }
  `;

    try {
        const res = await client.query<{ __schema: any }>({ query });
        const mutations = res.data?.__schema?.mutationType?.fields || [];

        // Filter campaign and coupon related mutations
        const campaignMutations = mutations.filter((m: any) =>
            m.name.toLowerCase().includes('campaign') ||
            m.name.toLowerCase().includes('coupon')
        );

        console.log(`✅ Found ${campaignMutations.length} campaign/coupon mutations:\n`);

        campaignMutations.forEach((mutation: any) => {
            console.log(`📌 ${mutation.name}`);
            if (mutation.description) {
                console.log(`   Description: ${mutation.description}`);
            }
            if (mutation.args && mutation.args.length > 0) {
                console.log(`   Arguments:`);
                mutation.args.forEach((arg: any) => {
                    const typeName = arg.type.ofType?.name || arg.type.name;
                    console.log(`     - ${arg.name}: ${typeName}`);
                });
            }
            console.log('');
        });

        // Save to JSON for further analysis
        fs.writeFileSync(
            'campaign_coupon_mutations.json',
            JSON.stringify(campaignMutations, null, 2),
            'utf-8'
        );

        console.log("\n💾 Detailed results saved to campaign_coupon_mutations.json");

        // Also introspect types for CouponInput, CampaignInput, etc.
        console.log("\n🔍 Looking for input types...\n");

        const typeQuery = gql`
      query IntrospectTypes {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
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
      }
    `;

        const typeRes = await client.query<{ __schema: any }>({ query: typeQuery });
        const types = typeRes.data?.__schema?.types || [];

        const couponTypes = types.filter((t: any) =>
            t.name?.toLowerCase().includes('coupon') ||
            t.name?.toLowerCase().includes('campaign')
        );

        console.log(`✅ Found ${couponTypes.length} relevant types\n`);

        couponTypes.forEach((type: any) => {
            if (type.inputFields && type.inputFields.length > 0) {
                console.log(`📋 INPUT TYPE: ${type.name}`);
                type.inputFields.forEach((field: any) => {
                    const typeName = field.type.ofType?.name || field.type.name;
                    console.log(`   - ${field.name}: ${typeName}`);
                });
                console.log('');
            }
        });

        // Save types
        fs.writeFileSync(
            'campaign_coupon_types.json',
            JSON.stringify(couponTypes, null, 2),
            'utf-8'
        );

        console.log("💾 Type details saved to campaign_coupon_types.json\n");

    } catch (e: any) {
        console.error("❌ Introspection Error:", e.message);
        if (e.response) {
            console.error("Response:", JSON.stringify(e.response, null, 2));
        }
    }
}

main();
