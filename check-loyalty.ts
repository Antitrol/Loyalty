import { getIkas } from './src/helpers/api-helpers';
import { AuthTokenManager } from './src/models/auth-token/manager';
import { getLoyaltyProfile, updateLoyaltyBalance } from './src/lib/loyalty/attributes';
import { GET_CUSTOMERS, SAVE_CUSTOMER } from './src/lib/graphql/loyalty';

async function main() {
    console.log("STEP 1: Starting Loyalty Test...");
    try {
        const tokens = await AuthTokenManager.list();
        console.log(`STEP 2: Tokens found: ${tokens.length}`);

        if (tokens.length === 0) {
            console.error("No auth token found!");
            return;
        }

        const token = tokens[0];
        console.log(`STEP 3: Using credentials for Store: ${token.merchantId}`);
        const client = getIkas(token);

        // 1. Get a customer ID
        console.log("STEP 4: Fetching customers...");
        const query = GET_CUSTOMERS;
        const custRes = await client.query<{ customers: any }>({ query });
        console.log("STEP 5: Fetch response received");

        let customerNode = custRes.data?.customers.edges[0]?.node;

        if (!customerNode) {
            console.log("STEP 6: No customers found. Initiating creation...");
            const mutation = SAVE_CUSTOMER;
            const input = {
                firstName: "Loyalty",
                lastName: "Tester",
                email: `tester_${Date.now()}@example.com`
            };

            console.log("STEP 7: Sending saveCustomer mutation...");
            const createRes = await client.query<{ saveCustomer: any }>({ query: mutation, variables: { input } });
            console.log("STEP 8: Customer creation response received");

            if (createRes.data?.saveCustomer?.userErrors?.length) {
                console.error("Failed to create customer:", JSON.stringify(createRes.data.saveCustomer.userErrors, null, 2));
                return;
            }
            customerNode = createRes.data?.saveCustomer?.customer;
            console.log("STEP 9: Created dummy customer:", customerNode.id);
        }

        const customerId = customerNode.id;
        console.log(`STEP 10: Testing with Customer: ${customerNode.firstName} (${customerId})`);

        // 2. Get Initial Profile
        const initialProfile = await getLoyaltyProfile(client, customerId);
        console.log("STEP 11: Initial Profile:", initialProfile);

        // 3. Add 50 Points
        console.log("STEP 12: Adding 50 points...");
        const updatedProfile = await updateLoyaltyBalance(client, customerId, 50, "Gold");
        console.log("STEP 13: Updated Profile:", updatedProfile);

        if (updatedProfile?.pointsBalance === (initialProfile?.pointsBalance || 0) + 50) {
            console.log("SUCCESS: Points updated correctly!");
        } else {
            console.error("FAILURE: Points mismatch!");
        }
    } catch (err: any) {
        console.error("CRITICAL ERROR:", err.message);
        if (err.response) console.error("Response:", JSON.stringify(err.response, null, 2));
        console.error(err);
    }
}

main();
