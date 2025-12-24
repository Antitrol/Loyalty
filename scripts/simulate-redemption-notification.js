
const fetch = require('node-fetch'); // Assuming node-fetch is available or using native fetch in Node 18+

const url = 'http://localhost:3000/api/loyalty/redeem';
const customerId = 'c2d78014-54ef-41ca-8aeb-443341d04cee';

console.log('Sending redemption request...');

// Note: To run this, the customer must have at least 500 points.
// If not, we might fail. The previous earn test gave 300 points. 
// Starting balance was likely 100 or 0. So current balance might be around 400.
// We might need to add points first.

async function run() {
    // 1. Add Points to be sure
    console.log('Adding points first...');
    await fetch('http://localhost:3000/api/loyalty/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, points: 600 })
    });

    // 2. Redeem
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
    });

    const data = await res.json();
    console.log('Redemption Response:', data);
}

run().catch(console.error);
