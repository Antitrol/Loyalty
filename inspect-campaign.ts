
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting Campaign Inputs...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectCampaignInputs {
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
        const createCampaign = res.data?.__schema?.types?.find((t: any) => t.name === 'CreateCampaignInput');

        if (createCampaign) {
            console.log("✅ CreateCampaignInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('create_campaign_input.json', JSON.stringify(createCampaign.inputFields, null, 2));
        }

        const addCoupons = res.data?.__schema?.types?.find((t: any) => t.name === 'AddCouponsToCampaignInput');
        if (addCoupons) {
            console.log("✅ AddCouponsToCampaignInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('add_coupons_input.json', JSON.stringify(addCoupons.inputFields, null, 2));
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
