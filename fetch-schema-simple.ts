
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
  console.log("🔍 Fetching Query Type Fields...");

  const tokens = await AuthTokenManager.list();
  if (!tokens.length) {
    console.error("❌ No tokens");
    return;
  }
  const client = getIkas(tokens[0]);

  const query = gql`
      query IntrospectQuery {
        __schema {
          queryType {
            fields {
          name
        }
      }
    }
  }
  `;

  try {
    const res = await client.query<{ __schema: any }>({ query });
    const fields = res.data?.__schema?.queryType?.fields;

    console.log("✅ Query Fields found: " + fields?.length);
    const names = fields?.map((f: any) => f.name).sort();
    const fs = require('fs');
    fs.writeFileSync('query_fields.json', JSON.stringify(names, null, 2));
    console.log("Written to query_fields.json");

  } catch (e: any) {
    console.error("❌ Error:", e.message);
  }
}

main();
