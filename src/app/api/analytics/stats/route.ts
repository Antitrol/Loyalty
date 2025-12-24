
import { NextResponse } from 'next/server';
import { LocalDB } from '@/lib/db/local-db';
import { AuthTokenManager } from '@/models/auth-token/manager';

export async function GET() {
    try {
        // Basic Security: Check if authenticated (token exists)
        // Ideally we check if the request comes from valid session, but for this demo app 
        // we check if we have tokens stored.
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stats = await LocalDB.getStats();

        return NextResponse.json({
            success: true,
            stats
        });
    } catch (error: any) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
