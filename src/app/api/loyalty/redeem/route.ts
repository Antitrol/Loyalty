import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { redeemPoints } from '@/lib/loyalty/rewards';

import { getLoyaltyProfile } from '@/lib/loyalty/attributes';
import { NotificationService } from '@/lib/notifications/service';
import { LocalDB } from '@/lib/db/local-db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId } = body;

        if (!customerId) {
            return NextResponse.json({ success: false, message: 'customerId is required' }, { status: 400 });
        }

        const tokens = await AuthTokenManager.list();
        if (!tokens.length) {
            return NextResponse.json({ success: false, message: 'Server not authenticated' }, { status: 500 });
        }

        const client = getIkas(tokens[0]);

        const result = await redeemPoints(client, customerId);

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.error }, { status: 400 });
        }

        // Send Notification
        if (result.code) {
            const profile = await getLoyaltyProfile(client, customerId);
            const email = profile?.email || "customer@example.com";
            NotificationService.sendRewardRedeemed(email, result.code, 50).catch(console.error);

            // Log Transaction
            LocalDB.logTransaction({
                customerId,
                type: 'REDEEM',
                points: 500,
                amount: 50
            }).catch(console.error);
        }

        return NextResponse.json({
            success: true,
            code: result.code,
            remainingPoints: result.remainingPoints
        });

    } catch (error: any) {
        console.error('Redemption Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
