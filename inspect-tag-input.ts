
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting CustomerTagInput...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectTagInput {
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
        const type = res.data?.__schema?.types?.find((t: any) => t.name === 'CustomerTagInput');

        if (type) {
            console.log("✅ CustomerTagInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('tag_input_fields.json', JSON.stringify(type.inputFields, null, 2));
        } else {
            console.log("❌ CustomerTagInput not found");
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
