import { NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { getLoyaltyProfile, updateLoyaltyBalance } from '@/lib/loyalty/attributes';
import { GET_CUSTOMERS, SAVE_CUSTOMER } from '@/lib/graphql/loyalty';
import { redeemPoints } from '@/lib/loyalty/rewards';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) return NextResponse.json({ error: 'No tokens found' }, { status: 400 });

        const token = tokens[0];
        const client = getIkas(token);

        // 1. Find or Create Customer
        const custRes = await client.query<{ customers: any }>({ query: GET_CUSTOMERS });
        let customerNode = custRes.data?.customers?.edges?.[0]?.node;

        let createRes: any = null;

        if (!customerNode) {
            const input = {
                firstName: "Loyalty",
                lastName: "Tester",
                email: `tester_${Date.now()}@example.com`
            };
            createRes = await client.query<{ createCustomer: any }>({ query: SAVE_CUSTOMER, variables: { input } });
            customerNode = createRes.data?.createCustomer;
        }

        if (!customerNode) return NextResponse.json({ error: 'Failed to find/create customer', debug: createRes }, { status: 500 });

        // 2. Initial Profile
        const initial = await getLoyaltyProfile(client, customerNode.id);

        // 3. Update: Add points to ensure enough for redemption (need 500)
        // Adding 600 to be safe
        const afterAdd = await updateLoyaltyBalance(client, customerNode.id, 600, 'Gold');

        // 4. Redeem Points
        const redemption = await redeemPoints(client, customerNode.id);

        // 5. Final Profile Check
        const final = await getLoyaltyProfile(client, customerNode.id);

        return NextResponse.json({
            success: true,
            customer: { id: customerNode.id, name: customerNode.firstName },
            initial,
            afterAdd,
            redemptionResult: redemption,
            finalProfile: final
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
