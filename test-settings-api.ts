
import { config } from 'dotenv';
config();

import { sign } from 'jsonwebtoken';
import fetch from 'node-fetch';

async function main() {
    console.log("🧪 Testing Settings API...");

    // 1. Create JWT
    const secret = process.env.CLIENT_SECRET;
    if (!secret) {
        console.error("❌ CLIENT_SECRET missing");
        return;
    }

    const token = sign({}, secret, {
        expiresIn: '1h',
        subject: 'test-merchant',
        issuer: process.env.NEXT_PUBLIC_DEPLOY_URL || 'http://localhost:3000',
        audience: 'test-app'
    });

    console.log("🔑 JWT Created");

    // 2. Define payload
    const payload = {
        earnPerAmount: 10,
        earnUnitAmount: 100,
        categoryBonuses: {
            "Giyim": 2,
            "Aksesuar": 5
        }
    };

    // 3. Send POST request
    try {
        console.log("📤 Sending POST request...");
        const res = await fetch('http://localhost:3000/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `JWT ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("✅ POST Response Status:", res.status);
        console.log("✅ POST Response Data:", JSON.stringify(data, null, 2));

        if (res.status === 200) {
            // 4. Send GET request to verify
            console.log("📥 Sending GET request to verify...");
            const getRes = await fetch('http://localhost:3000/api/settings', {
                headers: {
                    'Authorization': `JWT ${token}`
                }
            });
            const getData = await getRes.json();
            console.log("✅ GET Response Data:", JSON.stringify(getData, null, 2));

            if (getData.categoryBonuses && getData.categoryBonuses.Giyim === 2) {
                console.log("SUCCESS: Settings persisted correctly!");
            } else {
                console.error("FAILURE: Settings NOT persisted correctly.");
            }
        }

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main();
