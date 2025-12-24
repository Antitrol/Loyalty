
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting SimpleCustomerTag...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectTag {
        __schema {
          types {
            name
            fields {
                name
                type { name kind }
            }
          }
        }
      }
    `;

    try {
        const res = await client.query<{ __schema: any }>({ query });
        const type = res.data?.__schema?.types?.find((t: any) => t.name === 'SimpleCustomerTag');

        if (type) {
            console.log("✅ SimpleCustomerTag Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('tag_fields.json', JSON.stringify(type.fields, null, 2));
        } else {
            console.log("❌ SimpleCustomerTag not found");
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
