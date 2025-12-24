
import { NextRequest, NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { updateLoyaltyBalance } from '@/lib/loyalty/attributes';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, points } = body;

        if (!customerId || points === undefined) {
            return NextResponse.json({ error: 'customerId and points are required' }, { status: 400 });
        }

        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) return NextResponse.json({ error: 'No tokens found' }, { status: 400 });
        const token = tokens[0];
        const client = getIkas(token);

        const updatedProfile = await updateLoyaltyBalance(client, customerId, Number(points));

        return NextResponse.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
