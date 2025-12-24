
import { NextRequest, NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { getLoyaltyProfile } from '@/lib/loyalty/attributes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
        }

        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) return NextResponse.json({ error: 'No tokens found' }, { status: 400 });
        const token = tokens[0];
        const client = getIkas(token);

        const profile = await getLoyaltyProfile(client, customerId);

        return NextResponse.json({ success: true, profile }, {
            headers: {
                'Access-Control-Allow-Origin': '*', // Allow any storefront to access
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
