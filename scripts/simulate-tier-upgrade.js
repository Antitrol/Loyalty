
const fetch = require('node-fetch');

const url = 'http://localhost:3000/api/loyalty/add-points';
const customerId = 'c2d78014-54ef-41ca-8aeb-443341d04cee';

// Scenario:
// Customer starts with X points.
// We add 6000 points. (Bronze Threshold is 5000)
// Expectation: Tier becomes Bronze. Lifetime points increases.

console.log('--- Simulating Tier Upgrade ---');

async function run() {
    console.log(`Adding 6000 points...`);

    // Add Points via API (which uses updateLoyaltyBalance under the hood)
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerId,
            points: 6000
        })
    });

    const data = await res.json();
    console.log('Result:', data);

    if (data.profile) {
        console.log(`New Balance: ${data.profile.pointsBalance}`);
        console.log(`New Lifetime: ${data.profile.lifetimePoints}`);
        console.log(`New Tier: ${data.profile.tier}`);

        if (data.profile.tier === 'Bronze' || data.profile.tier === 'Silver' || data.profile.tier === 'Gold') {
            console.log('✅ Tier Upgraded Successfully!');
        } else {
            console.log('❌ Tier Upgrade Failed (Unless starting balance was negative or reset)');
        }
    }
}

run().catch(console.error);
