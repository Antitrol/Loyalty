
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Introspecting listCategory...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query TypeInfo {
        __type(name: "Query") {
          fields(includeDeprecated: true) {
            name
            args {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
            type {
              name
              kind
              ofType {
                name
                kind
                fields {
                  name
                }
                ofType {
                    name
                    kind
                    fields {
                        name
                    }
                }
              }
              fields {
                name
              }
            }
          }
        }
      }
    `;

    try {
        const res = await client.query<{ __type: any }>({ query });
        const fields = res.data?.__type?.fields;

        const catField = fields.find((f: any) => f.name === 'listCategory');

        if (catField) {
            console.log("✅ Found listCategory!");
            console.log("Arguments:", JSON.stringify(catField.args, null, 2));
            console.log("Return Type:", JSON.stringify(catField.type, null, 2));
        } else {
            console.error("❌ listCategory NOT FOUND in Query type!");
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
