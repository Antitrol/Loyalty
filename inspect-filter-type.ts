
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting StringFilterInput...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectFilter {
        __schema {
          types {
            name
            inputFields {
                name
                type { name kind }
            }
          }
        }
      }
    `;

    try {
        const res = await client.query<{ __schema: any }>({ query });
        const filterType = res.data?.__schema?.types?.find((t: any) => t.name === 'StringFilterInput');

        if (filterType) {
            console.log("✅ StringFilterInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('filter_introspection.json', JSON.stringify(filterType.inputFields, null, 2));
        } else {
            console.log("❌ StringFilterInput not found");
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
