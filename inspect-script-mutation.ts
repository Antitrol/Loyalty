
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting createStorefrontJSScript Mutation...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectMutation {
        __schema {
          mutationType {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                  inputFields {
                    name
                    type { name kind }
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
        const mutation = res.data?.__schema?.mutationType?.fields?.find((f: any) => f.name === 'createStorefrontJSScript');

        if (mutation) {
            console.log("✅ Mutation Found:", JSON.stringify(mutation, null, 2));
        } else {
            console.log("❌ Mutation 'createStorefrontJSScript' NOT found.");
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
