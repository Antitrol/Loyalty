
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting CustomerAttributeCreateInput...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectCreateAttr {
        __schema {
          types {
            name
            inputFields {
                name
                type { name kind }
            }
            enumValues {
                name
            }
          }
        }
      }
    `;

    try {
        const res = await client.query<{ __schema: any }>({ query });
        const inputType = res.data?.__schema?.types?.find((t: any) => t.name === 'CustomerAttributeCreateInput');

        if (inputType) {
            console.log("✅ CustomerAttributeCreateInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('create_attribute_input.json', JSON.stringify(inputType.inputFields, null, 2));
        } else {
            console.log("❌ CustomerAttributeCreateInput not found");
        }

        const enumType = res.data?.__schema?.types?.find((t: any) => t.name === 'CustomerAttributeType');
        if (enumType) {
            console.log("✅ CustomerAttributeType Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('attribute_type_enum.json', JSON.stringify(enumType.enumValues, null, 2));
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
