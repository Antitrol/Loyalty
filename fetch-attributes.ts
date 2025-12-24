
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Fetching Customer Attributes...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    // Correct query: listCustomerAttribute { id name } (returns list directly)
    const query = gql`
      query ListAttributes {
        listCustomerAttribute {
           id
           name
        }
      }
    `;

    try {
        const res = await client.query<{ listCustomerAttribute: any }>({ query });
        console.log("Response Keys:", Object.keys(res.data?.listCustomerAttribute || {}));
        const attrs = Array.isArray(res.data?.listCustomerAttribute) ? res.data?.listCustomerAttribute : [];


        console.log("✅ Attributes Found: " + attrs?.length);
        console.log(JSON.stringify(attrs, null, 2));
        console.log(JSON.stringify(attrs, null, 2));

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
