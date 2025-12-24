
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { gql } from 'graphql-request';

async function main() {
    console.log("🔍 Inspecting Campaign Enums & Types...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    const query = gql`
      query IntrospectCampaignTypes {
        __schema {
          types {
            name
            enumValues {
                name
            }
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

        // Find FixedDiscountInput
        const fixedDiscount = res.data?.__schema?.types?.find((t: any) => t.name === 'FixedDiscountInput');
        if (fixedDiscount) {
            console.log("✅ FixedDiscountInput Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('fixed_discount_input.json', JSON.stringify(fixedDiscount.inputFields, null, 2));
        }

        // Find CampaignTypeEnum (guessing name)
        const campaignType = res.data?.__schema?.types?.find((t: any) => t.name === 'CampaignType' || t.name === 'CampaignTypeEnum');
        if (campaignType) {
            console.log("✅ CampaignType Found. Writing to file...");
            const fs = require('fs');
            fs.writeFileSync('campaign_type_enum.json', JSON.stringify(campaignType.enumValues, null, 2));
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
