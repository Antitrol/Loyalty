
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting UpdateCustomerInput...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectUpdateCustomerInput {
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
        const inputType = res.data?.__schema?.types?.find((t: any) => t.name === 'UpdateCustomerInput');

        if (inputType) {
            console.log("✅ UpdateCustomerInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('update_customer_input.json', JSON.stringify(inputType.inputFields, null, 2));
        } else {
            console.log("❌ UpdateCustomerInput not found");
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
