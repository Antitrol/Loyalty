
import { config } from 'dotenv';
config();

import { AuthTokenManager } from './src/models/auth-token/manager';
import { getIkas } from './src/helpers/api-helpers';
import { updateLoyaltyBalance } from './src/lib/loyalty/attributes';
import { redeemPoints } from './src/lib/loyalty/rewards';
import { getLoyaltyProfile } from './src/lib/loyalty/attributes';

async function main() {
    console.log("🚀 Starting Redemption Simulation...");

    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        console.error("❌ No tokens");
        return;
    }
    const client = getIkas(tokens[0]);

    // 1. Get a customer (hardcoded from previous logs for stability: 4446e914-b636-4601-85e1-f9dec6635b7e)
    const customerId = "4446e914-b636-4601-85e1-f9dec6635b7e";
    console.log(`👤 Using Customer: ${customerId}`);

    // 2. Ensure enough points
    console.log("💰 Top up 600 points...");
    // Just add 600, don't worry about previous balance, unless it's huge. 
    // updateLoyaltyBalance adds delta.
    await updateLoyaltyBalance(client, customerId, 600);

    // Check balance
    let profile = await getLoyaltyProfile(client, customerId);
    console.log(`✅ Current Balance: ${profile?.pointsBalance}`);

    // 3. Redeeming
    console.log("🔥 Redeeming 500 points...");
    const result = await redeemPoints(client, customerId);

    if (result.success) {
        console.log("🎉 SUCCESS: Redemption Successful!");
        console.log(`🎟️ Coupon Code: ${result.code}`);
        console.log(`📉 Remaining Points: ${result.remainingPoints}`);
    } else {
        console.error(`❌ FAILED: ${result.error}`);
    }

    // 4. Verify balance again
    profile = await getLoyaltyProfile(client, customerId);
    console.log(`✅ Final Balance: ${profile?.pointsBalance}`);
}

main();
