
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting CustomerAttributeValue...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectAttribute {
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
        const type = res.data?.__schema?.types?.find((t: any) => t.name === 'CustomerAttributeValue');

        if (type) {
            console.log("✅ CustomerAttributeValue Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('attribute_introspection.json', JSON.stringify(type.fields, null, 2));
        } else {
            console.log("❌ CustomerAttributeValue not found");
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
