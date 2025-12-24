
const fetch = require('node-fetch');

// 1. Get a Referrer ID (Fixed Demo User)
const referrerId = 'c2d78014-54ef-41ca-8aeb-443341d04cee';

// 2. Get a Referee ID (New Customer)
// We'll abuse the debug endpoint to get/create a second customer.
// It creates a 'Tester' customer if one doesn't exist, OR returns the first one found.
// The first one found might be our referrer... that would be bad.
// Let's assume we need to manually create a fake ID or just trust the debug endpoint creates a new one?
// Actually, earlier logs showed a different ID for the debug endpoint vs my hardcoded one?
// Let's try to fetch the debug endpoint first and see what ID it returns.

async function run() {
    console.log('--- Simulating Referral ---');

    // Step A: get a referee
    console.log('Fetching/Creating Referee Customer...');
    const debugRes = await fetch('http://localhost:3000/api/debug/loyalty-test');
    const debugData = await debugRes.json();

    const refereeId = debugData.customer?.id;

    if (!refereeId) {
        console.error('Failed to get referee ID');
        return;
    }

    console.log(`Referee ID: ${refereeId}`);

    if (refereeId === referrerId) {
        console.warn("Warning: Referrer and Referee are same. This will fail. Attempting anyway to see validation.");
    }

    // Step B: Claim Referral
    console.log(`Claiming Referral: ${referrerId} referred ${refereeId}`);

    const claimRes = await fetch('http://localhost:3000/api/loyalty/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerId, refereeId })
    });

    const claimData = await claimRes.json();
    console.log('Claim Result:', claimData);
}

run().catch(console.error);
