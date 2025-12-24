
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting listCustomerAttribute...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectListAttribute {
        __schema {
          queryType {
            fields {
              name
              args {
                name
                type { name kind }
              }
              type {
                name
                kind
                ofType {
                    name
                    kind
                    fields {
                        name
                        type { name kind ofType { name kind } }
                    }
                }
              }
            }
          }
        }
      }
    `;

    try {
        const res = await client.query<{ __schema: any }>({ query });
        const field = res.data?.__schema?.queryType?.fields?.find((f: any) => f.name === 'listCustomerAttribute');

        if (field) {
            console.log("✅ listCustomerAttribute Found. Writing to file...");
            const fs = require('fs');
            // We want to see the fields of the Return Type (CustomerAttributePaginationResponse?) -> data -> [CustomerAttribute]
            fs.writeFileSync('list_attribute_introspection.json', JSON.stringify(field, null, 2));
        } else {
            console.log("❌ listCustomerAttribute not found");
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
