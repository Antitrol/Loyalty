
import { config } from 'dotenv';
config();

import axios from 'axios';
import crypto from 'crypto';
import { getIkas } from './src/helpers/api-helpers';
import { AuthTokenManager } from './src/models/auth-token/manager';
import { GET_CUSTOMERS } from './src/lib/graphql/loyalty';
import fs from 'fs';

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync('simulation_debug.log', msg + '\n');
}

async function main() {
    log("🚀 Starting Webhook Simulation...");

    const secret = process.env.CLIENT_SECRET;
    if (!secret) {
        log("❌ Error: CLIENT_SECRET is missing in .env");
        process.exit(1);
    }

    // 1. Get a Real Customer ID
    log("🔑 Fetching auth tokens...");
    const tokens = await AuthTokenManager.list();
    if (!tokens.length) {
        log("❌ No auth tokens found");
        return;
    }
    const client = getIkas(tokens[0]);

    log("👤 Fetching customers...");
    const custRes = await client.query<{ listCustomer: any }>({ query: GET_CUSTOMERS });
    const customer = custRes.data?.listCustomer?.data?.[0]; // listCustomer.data is the array

    if (!customer) {
        log("❌ No customer found to simulate order for. Response: " + JSON.stringify(custRes));
        return;
    }

    log(`👤 Simulating order for: ${customer.firstName} (${customer.id})`);

    // 2. Prepare Payload
    const payload = {
        id: `order_${Date.now()}`,
        customerId: customer.id,
        totalFinalPrice: 200.00, // Should award 200 points (Standard Tier)
        currency: "TRY"
    };
    const body = JSON.stringify(payload);

    // 3. Sign Payload
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(body, 'utf8').digest('base64');

    log(`🔐 Generated Signature: ${signature.substring(0, 10)}...`);

    // 4. Send Webhook
    try {
        log("📡 Sending webhook request...");
        const response = await axios.post('http://localhost:3000/api/webhooks/order-created', payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Ikas-Hmac-Sha256': signature
            }
        });

        log(`✅ Webhook Response: ${response.status} ${response.statusText}`);
        log("📦 Response Data: " + JSON.stringify(response.data));

        if (response.data.success && response.data.pointsEarned === 200) {
            log("🎉 SUCCESS: Points calculated and awarded correctly!");
        } else {
            log("⚠️  WARNING: Response indicates success but points might be mismatched.");
        }

    } catch (error: any) {
        const errorLog = {
            success: false,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        };
        log("❌ Webhook Request Failed: " + JSON.stringify(errorLog, null, 2));
    }
}

main().catch(err => log("❌ CRITICAL ERROR: " + err));
