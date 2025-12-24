
import { NextRequest, NextResponse } from 'next/server';
import { verifyIkasWebhook } from '@/lib/webhooks/verify';
import { calculateRefundPoints } from '@/lib/loyalty/earn';
import { getLoyaltyProfile, updateLoyaltyBalance } from '@/lib/loyalty/attributes';
import { NotificationService } from '@/lib/notifications/service';
import { LocalDB } from '@/lib/db/local-db';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-ikas-hmac-sha256');
        const bodyText = await req.text();

        if (!verifyIkasWebhook(bodyText, signature)) {
            console.warn('Webhook signature verification failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(bodyText);
        console.log('Refund Webhook Payload:', JSON.stringify(payload, null, 2));

        // Handle both direct and wrapped payload structures
        const refundData = payload.data || payload;

        // Assuming payload has customerId and amount (refunded amount)
        // Adjust these fields based on actual Ikas refund payload
        const { customerId, amount } = refundData;

        if (!customerId) {
            console.log('Skipping: No customerId in refund webhook');
            return NextResponse.json({ message: 'No customer attached to refund' }, { status: 200 });
        }

        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
        const client = getIkas(tokens[0]);

        // 1. Get current profile to determine tier and current balance
        const profile = await getLoyaltyProfile(client, customerId);

        if (!profile) {
            return NextResponse.json({ message: 'Customer profile not found, skipping deduction' }, { status: 200 });
        }

        // 2. Calculate Points to Deduct
        // refundData.amount is usually positive (e.g. 100.00)
        const pointsToDeduct = calculateRefundPoints(amount || 0, profile.tier);

        if (pointsToDeduct > 0) {
            // we pass negative delta to reduce points
            const updatedProfile = await updateLoyaltyBalance(client, customerId, -pointsToDeduct);
            console.log(`Deducted ${pointsToDeduct} points from ${customerId} due to refund`);

            // 3. Send Notification
            if (updatedProfile) {
                const customerEmail = refundData.customerEmail || profile.email || "customer@example.com";
                NotificationService.sendPointsRefunded(
                    customerEmail,
                    pointsToDeduct,
                    updatedProfile.pointsBalance
                ).catch(console.error);

                // Log Transaction
                LocalDB.logTransaction({
                    customerId,
                    type: 'REFUND',
                    points: pointsToDeduct,
                    amount: amount || 0
                }).catch(console.error);
            }
        }

        return NextResponse.json({ success: true, pointsDeducted: pointsToDeduct });
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
