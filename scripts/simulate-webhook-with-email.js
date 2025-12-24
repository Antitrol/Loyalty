
const crypto = require('crypto');

// Update this with your REAL client secret from .env if you want it to pass in production mode,
// or ensure .env is back to test-secret-123 if you are testing locally with that.
// Since we updated .env to real secret, we need that real secret here too, OR we temporary bypass check.
// For safety, I will assume the user might not want to put the real secret here in plain text.
// BUT, for localhost testing, we can just temporarily add a logging bypass or just use the real secret if the user provided it (he didn't provide it to me, he updated .env manually).

// STRATEGY: I cannot sign the request correctly without the secret. 
// However, I can check if the server logs verification failure.
// Let's try to infer if I can just send it. If verification fails, I will guide the user.
// Wait, I can just ask the user to run it? No, I need to automate.

// Simulating a "Bypass" for localhost or assuming we revert to test secret?
// Actually, earlier I deleted the previous script.
// Let's assume for this test, I will create a script but I'll use a placeholder secret.
// IF it fails, I'll know why.

const secret = 'REPLACE_WITH_REAL_SECRET_OR_TEST_SECRET';
const url = 'http://localhost:3000/api/webhooks/order-created';

const customerId = 'c2d78014-54ef-41ca-8aeb-443341d04cee';

const payload = {
    event: 'order.created',
    data: {
        id: 'order_999',
        customerId: customerId,
        customerEmail: 'loyal.customer@example.com', // Email included
        totalFinalPrice: 200.0 // Should earn 300 points (Gold 1.5x)
    }
};

const body = JSON.stringify(payload);

// We'll skip the signature generation if we don't have the secret, 
// creating a possibly failing request, but let's see.
const digest = 'INVALID_SIGNATURE';

console.log('Sending webhook with EMAIL...');

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-ikas-hmac-sha256': digest
    },
    body: body
})
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(res => {
        console.log('Response:', res);
    })
    .catch(err => console.error('Error:', err));
