
import { NextRequest, NextResponse } from 'next/server';
import { verifyIkasWebhook } from '@/lib/webhooks/verify';
import { calculatePoints } from '@/lib/loyalty/earn';
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
        console.log('Webhook Payload:', JSON.stringify(payload, null, 2));

        // Handle both direct and wrapped payload structures
        const orderData = payload.data || payload;
        const { customerId, totalFinalPrice } = orderData;

        if (!customerId) {
            console.log('Skipping: No customerId in webhook');
            return NextResponse.json({ message: 'No customer attached to order' }, { status: 200 });
        }

        // Get Auth Token (Assuming single store for now)
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            console.error('No auth token available to process webhook');
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
        const client = getIkas(tokens[0]);

        // 1. Get current profile to determine tier
        let profile = await getLoyaltyProfile(client, customerId);

        // If no profile exists, treat as New/Standard
        if (!profile) {
            profile = {
                customerId,
                pointsBalance: 0,
                tier: 'Standard',
                lifetimePoints: 0
            };
        }

        // 2. Calculate Points
        const pointsEarned = calculatePoints(totalFinalPrice, profile.tier);

        if (pointsEarned > 0) {
            const updatedProfile = await updateLoyaltyBalance(client, customerId, pointsEarned);
            console.log(`Awarded ${pointsEarned} points to ${customerId}`);

            // 3. Send Notification
            if (updatedProfile) {
                // Log Transaction
                LocalDB.logTransaction({
                    customerId,
                    type: 'EARN',
                    points: pointsEarned,
                    amount: orderData.totalFinalPrice || 0
                }).catch(console.error);

                // Try to get email from webhook payload first, then profile (if stored)
                // Note: getLoyaltyProfile might need to fetch email if not already there, 
                // but for now relying on what we have or payload.
                const customerEmail = orderData.customerEmail || orderData.email || "customer@example.com";

                // Fire and forget notification
                NotificationService.sendPointsEarned(customerEmail, pointsEarned, updatedProfile.pointsBalance).catch(console.error);
            }
        }

        return NextResponse.json({ success: true, pointsEarned });
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
