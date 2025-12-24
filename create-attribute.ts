
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🛠️ Creating Customer Attribute...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    // Input: CustomerAttributeCreateInput
    // Check introspection for input fields? I'll guess standard name/type.
    // Based on listCustomerAttribute { id name }, create should take name.

    // I need to know input type name. Usually createCustomerAttribute(input: CustomerAttributeCreateInput!)
    const mutation = gql`
      mutation CreateAttribute($input: CustomerAttributeCreateInput!) {
        createCustomerAttribute(input: $input) {
          id
          name
        }
      }
    `;

    const input = {
        name: "loyalty_points_balance",
        type: "NUMBER" // Guessing enum: STRING, NUMBER, DATE, etc.
        // If type is wrong, error will tell me allowed values.
    };

    try {
        const res = await client.mutate<{ createCustomerAttribute: any }>({ mutation, variables: { input } });
        console.log("✅ Attribute Created:", res.data?.createCustomerAttribute);

    } catch (e: any) {
        console.log("Response Keys:", Object.keys(e));
        console.error("❌ Error:", e.message || JSON.stringify(e));
    }
}

main();
