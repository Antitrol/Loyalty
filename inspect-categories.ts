
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
  console.log("🔍 Fetching Categories...");

  const tokens = await AuthTokenManager.list();
  if (!tokens.length) {
    console.error("❌ No tokens");
    return;
  }
  const client = getIkas(tokens[0]);

  const query = gql`
      query ListCategory {
        listCategory {
          id
          name
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
