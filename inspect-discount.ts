
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting Discount Mutations...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    // First list all mutations to find the correct name
    const query = gql`
      query IntrospectMutations {
        __schema {
          mutationType {
            fields {
              name
            }
          }
        }
      }
    `;

    try {
        const res = await client.query<{ __schema: any }>({ query });
        const fields = res.data?.__schema?.mutationType?.fields;
        const discountMutations = fields?.filter((f: any) =>
            f.name.toLowerCase().includes('discount') ||
            f.name.toLowerCase().includes('coupon') ||
            f.name.toLowerCase().includes('campaign')
        );

        console.log("✅ Found Mutations:", discountMutations?.map((m: any) => m.name));

        if (discountMutations?.length > 0) {
            const fs = require('fs');
            fs.writeFileSync('discount_mutations.json', JSON.stringify(discountMutations, null, 2));
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
