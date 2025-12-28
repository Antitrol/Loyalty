
import { NextRequest, NextResponse } from 'next/server';
import { verifyIkasWebhook } from '@/lib/webhooks/verify';
import { calculatePoints, calculateLineItemPoints } from '@/lib/loyalty/earn';
import { getLoyaltyProfile, updateLoyaltyBalance } from '@/lib/loyalty/attributes';
import { NotificationService } from '@/lib/notifications/service';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-ikas-hmac-sha256');
        const bodyText = await req.text();

        if (!verifyIkasWebhook(bodyText, signature)) {
            console.warn('Webhook signature verification failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = JSON.parse(bodyText);
        // Handle both direct and wrapped payload (webhook test vs live often differs)
        const orderData = payload.data || payload;
        const { customerId, totalFinalPrice } = orderData;

        if (!customerId) {
            console.log('Skipping: No customerId in webhook');
            return NextResponse.json({ message: 'No customer attached to order' }, { status: 200 });
        }

        // Get Auth Token
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            console.error('No auth token available');
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
        const client = getIkas(tokens[0]);

        // 1. Get Settings & Profile
        const [settings, profile] = await Promise.all([
            prisma.loyaltySettings.findUnique({ where: { id: 'default' } }),
            getLoyaltyProfile(client, customerId)
        ]);

        // Use default settings if none exist
        const safeSettings = settings || {
            earnPerAmount: 1,
            earnUnitAmount: 1,
            excludeShipping: false,
            excludeDiscounted: false,
            welcomeBonus: 0,
            categoryBonuses: null
        };

        // If no profile exists, treat as New
        let currentProfile = profile;
        let isNewCustomer = false;
        if (!currentProfile) {
            isNewCustomer = true;
            currentProfile = {
                customerId,
                pointsBalance: 0,
                tier: 'Standard',
                lifetimePoints: 0
            };
        }

        // 2. Logic: Calculate Base Amount (Exclusions)
        let calculationAmount = orderData.totalFinalPrice || 0;

        if (safeSettings.excludeShipping) {
            calculationAmount -= (orderData.totalShippingPrice || 0);
        }

        // Note: 'totalDiscount' might be distributed, simple subtraction for now if field exists
        // If excludeDiscounted is true, we might skip the whole order or subtract discount
        // Logic: If excludeDiscounteds is TRUE and order has discount, earn 0? Or just subtract?
        // Let's assume subtract discount from calculable base for now to be safe.
        // Actually Ikas 'totalFinalPrice' usually includes discounts.
        // If user wants to exclude discounted items completely, that requires line-item analysis.
        // For 'Simple Mode', we will subtract the totalDiscount amount from the base if setting is on.
        if (safeSettings.excludeDiscounted && orderData.totalDiscount > 0) {
            calculationAmount -= orderData.totalDiscount;
        }

        calculationAmount = Math.max(0, calculationAmount);

        // 3. Calculate Points with New Formula
        let pointsEarned = 0;
        const hasCategoryRules = (safeSettings as any).categoryBonuses && Object.keys((safeSettings as any).categoryBonuses).length > 0;
        const lineItems = orderData.orderLineItems || [];

        if (hasCategoryRules && lineItems.length > 0) {
            console.log("⚡ Applying Category-Based Rules...");
            let totalItemPoints = 0;

            for (const item of lineItems) {
                const catName = item.product?.categoryName || item.categoryName || "";
                const categories = catName ? [catName] : [];
                // Use finalPrice of item
                const itemPrice = item.finalPrice || item.price || 0;

                const p = calculateLineItemPoints(itemPrice, categories, safeSettings);
                totalItemPoints += p;
            }

            // Apply Tier Multiplier to total base points
            // Multiplier from dynamic settings (or default if missing)
            const tiers = (safeSettings as any).tiers || [
                { name: 'Standard', multiplier: 1 },
                { name: 'Bronze', multiplier: 1.1 },
                { name: 'Silver', multiplier: 1.25 },
                { name: 'Gold', multiplier: 1.5 },
                { name: 'Platinum', multiplier: 2.0 },
            ];
            const activeTier = tiers.find((t: any) => t.name === currentProfile.tier);
            const tierMultiplier = activeTier ? activeTier.multiplier : 1.0;

            pointsEarned = Math.floor(totalItemPoints * tierMultiplier);
        } else {
            // Standard Calculation
            pointsEarned = calculatePoints(calculationAmount, currentProfile.tier, safeSettings);
        }

        let logMetadata: any = {
            orderId: orderData.id,
            currency: orderData.currency || 'TRY',
            calculationAmount: calculationAmount,
            appliedCategoryRules: hasCategoryRules
        };

        // 4. Welcome Bonus
        if (isNewCustomer && safeSettings.welcomeBonus > 0) {
            // Check if they really have no prior transactions in OUR DB (migrated users might be 'new' to Ikas API but not us)
            // But here, if getLoyaltyProfile returned null, they are likely new.
            pointsEarned += safeSettings.welcomeBonus;
            logMetadata.appliedWelcomeBonus = safeSettings.welcomeBonus;
            console.log(`🎁 Welcome Bonus Applied: ${safeSettings.welcomeBonus}`);
        }

        if (pointsEarned > 0) {
            const updatedProfile = await updateLoyaltyBalance(client, customerId, pointsEarned, undefined, safeSettings);

            // Try to get email
            const customerEmail = orderData.customerEmail || orderData.email || "customer@example.com";

            // Persist
            try {
                await prisma.$transaction([
                    prisma.loyaltyTransaction.create({
                        data: {
                            customerId,
                            type: 'EARN',
                            points: pointsEarned,
                            amount: calculationAmount, // Log the amount used for calc
                            metadata: { ...logMetadata, email: customerEmail }
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
                console.log(`✅ Awarded ${pointsEarned} points to ${customerId}`);
            } catch (dbError) {
                console.error("Failed to persist points to DB:", dbError);
            }

            // Notification
            NotificationService.sendPointsEarned(customerEmail, pointsEarned, updatedProfile ? updatedProfile.pointsBalance : 0).catch(console.error);
        }

        return NextResponse.json({ success: true, pointsEarned });
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
