
import { NextRequest, NextResponse } from 'next/server';
import { verifyIkasWebhook } from '@/lib/webhooks/verify';
import { calculatePoints } from '@/lib/loyalty/earn';
import { getLoyaltyProfile, updateLoyaltyBalance } from '@/lib/loyalty/attributes';
import { NotificationService } from '@/lib/notifications/service';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma'; // Import Prisma

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

        // 1. Get Settings & Profile
        const [settings, profile] = await Promise.all([
            prisma.loyaltySettings.findUnique({ where: { id: 'default' } }),
            getLoyaltyProfile(client, customerId)
        ]);

        const earnRatio = settings?.earnRatio || 1.0;

        // If no profile exists, treat as New/Standard
        let currentProfile = profile;
        if (!currentProfile) {
            currentProfile = {
                customerId,
                pointsBalance: 0,
                tier: 'Standard',
                lifetimePoints: 0
            };
        }

        // 2. Calculate Points
        const pointsEarned = calculatePoints(totalFinalPrice, currentProfile.tier, earnRatio);

        if (pointsEarned > 0) {
            const updatedProfile = await updateLoyaltyBalance(client, customerId, pointsEarned);
            console.log(`Awarded ${pointsEarned} points to ${customerId} (Ratio: ${earnRatio})`);

            // 3. Send Notification
            if (updatedProfile) {
                // Try to get email from webhook payload first, then profile (if stored)
                const customerEmail = orderData.customerEmail || orderData.email || "customer@example.com";

                // Log Transaction to Database (Replaces LocalDB)
                try {
                    await prisma.$transaction([
                        prisma.loyaltyTransaction.create({
                            data: {
                                customerId,
                                type: 'EARN',
                                points: pointsEarned,
                                amount: orderData.totalFinalPrice || 0,
                                metadata: {
                                    orderId: orderData.id,
                                    currency: orderData.currency || 'TRY',
                                    email: customerEmail
                                }
                            }
                        }),
                        prisma.loyaltyBalance.upsert({
                            where: { customerId },
                            create: {
                                customerId,
                                firstName: orderData.customerFirstName || orderData.firstName,
                                lastName: orderData.customerLastName || orderData.lastName,
                                email: customerEmail,
                                points: pointsEarned
                            },
                            update: {
                                firstName: orderData.customerFirstName || orderData.firstName,
                                lastName: orderData.customerLastName || orderData.lastName,
                                email: customerEmail,
                                points: { increment: pointsEarned }
                            }
                        })
                    ]);
                    console.log(`✅ Persisted ${pointsEarned} points for ${customerId} to DB.`);
                } catch (dbError) {
                    console.error("Failed to persist points to DB:", dbError);
                    // Verify if we should throw or continue (Notification is already sent)
                }

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
