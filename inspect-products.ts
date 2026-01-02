
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Fetching Products...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    // Basit bir urun sorgusu
    const query = gql`
      query ListProduct {
        listProduct(pagination: { limit: 5 }) {
          data {
            id
            name
          }
        }
      }
    `;

    try {
        const res = await client.query<any>({ query });
        console.log("✅ Response:", JSON.stringify(res, null, 2));

    } catch (e: any) {
        console.error("❌ Error:", e.message);
        if (e.response) {
            console.error("Errors:", JSON.stringify(e.response.errors, null, 2));
        }
    }
}

main();
