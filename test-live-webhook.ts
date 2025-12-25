
import { config } from 'dotenv';
config();

import axios from 'axios';
import crypto from 'crypto';

async function main() {
    console.log("🚀 Starting LIVE Webhook Simulation...");

    // TARGET URL
    const TARGET_URL = 'https://loyalty-8isa.vercel.app/api/webhooks/order-created';

    const secret = process.env.CLIENT_SECRET;
    if (!secret) {
        console.log("❌ Error: CLIENT_SECRET is missing in .env");
        process.exit(1);
    }

    // HARDCODED CUSTOMER ID from User
    const customer = {
        id: "c96a444e-3341-4811-a62a-400163e9849e",
        firstName: "Test User",
        email: "test@example.com"
    };

    console.log(`👤 Simulating LIVE order for: ${customer.firstName} (${customer.id})`);

    // 2. Prepare Payload
    const payload = {
        id: `live_test_order_${Date.now()}`,
        customerId: customer.id,
        totalFinalPrice: 150.00, // Should award 150 points
        currency: "TRY",
        customerEmail: customer.email
    };
    const body = JSON.stringify(payload);

    // 3. Sign Payload
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(body, 'utf8').digest('base64');

    console.log(`🔐 Generated Signature for live request...`);
    console.log(`📡 Sending request to: ${TARGET_URL}`);

    // 4. Send Webhook
    try {
        const response = await axios.post(TARGET_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Ikas-Hmac-Sha256': signature
            }
        });

        console.log(`✅ Response Status: ${response.status}`);
        console.log("📦 Response Data:", JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log("🎉 VERIFICATION SUCCESSFUL: The live webhook accepted the request and processed points.");
        } else {
            console.log("⚠️  WARNING: Webhook returned 200 but success=false or unexpected data.");
        }

    } catch (error: any) {
        console.log("❌ Webhook Request Failed:");
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(error.message);
        }
    }
}

main().catch(console.error);
