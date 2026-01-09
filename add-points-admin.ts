/**
 * Script to manually add points to a customer via admin panel
 * Run this with: npx tsx add-points-admin.ts
 */

const CUSTOMER_ID = 'b7ed7574-a51e-47a7-b0d4-d39f10fb2455';
const POINTS_TO_ADD = 2000;

async function addPointsViaAPI() {
    try {
        // Using the admin API to add points
        const response = await fetch('http://localhost:3000/api/customers/adjust-points', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId: CUSTOMER_ID,
                points: POINTS_TO_ADD,
                reason: 'Test points for redemption feature',
                type: 'MANUAL_ADD'
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (response.ok) {
            console.log(`✅ Successfully added ${POINTS_TO_ADD} points to customer ${CUSTOMER_ID}`);
            console.log(`New balance: ${data.newBalance} points`);
        } else {
            console.error('❌ Failed to add points:', data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addPointsViaAPI();
