
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
  console.log("🔍 Inspecting Customer Type & Query...");

  const tokens = await AuthTokenManager.list();
  if (!tokens.length) {
    console.error("❌ No tokens");
    return;
  }
  const client = getIkas(tokens[0]);

  const query = gql`
      query IntrospectCustomerType {
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
    const customerType = res.data?.__schema?.types?.find((t: any) => t.name === 'Customer');

    if (customerType) {
      console.log("✅ Customer Type Found. Writing to file...");
      const fs = require('fs');
      fs.writeFileSync('customer_fields.json', JSON.stringify(customerType.fields, null, 2));
    } else {
      console.log("❌ Customer Type not found");
    }
  } catch (e: any) {
    console.error("❌ Error:", e.message);
  }
}

main();
