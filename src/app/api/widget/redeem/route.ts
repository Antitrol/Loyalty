import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Widget Redeem Endpoint - No auth required
 * Allows customers to redeem points directly from widget
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, pointsToRedeem } = body;

        // Validation
        if (!customerId) {
            return NextResponse.json({
                success: false,
                error: 'Customer ID required'
            }, { status: 400 });
        }

        if (!pointsToRedeem || pointsToRedeem <= 0) {
            return NextResponse.json({
                success: false,
                error: 'Invalid points amount'
            }, { status: 400 });
        }

        // Get customer balance
        const customer = await prisma.loyaltyBalance.findUnique({
            where: { customerId }
        });

        if (!customer) {
            return NextResponse.json({
                success: false,
                error: 'Customer not found'
            }, { status: 404 });
        }

        // Check if sufficient points
        if (customer.points < pointsToRedeem) {
            return NextResponse.json({
                success: false,
                error: 'Insufficient points',
                currentPoints: customer.points,
                requiredPoints: pointsToRedeem
            }, { status: 400 });
        }

        // Get settings for burn ratio
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        const burnRatio = settings?.burnRatio || 100; // 100 points = 1 TL
        const discountValue = pointsToRedeem / burnRatio;

        // Generate unique coupon code
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = randomBytes(3).toString('hex').toUpperCase();
        const code = `LOYALTY-${timestamp}-${random}`;

        // Start transaction - update balance and log redemption
        const [updatedCustomer, transaction] = await prisma.$transaction([
            // Deduct points
            prisma.loyaltyBalance.update({
                where: { customerId },
                data: {
                    points: customer.points - pointsToRedeem
                }
            }),
            // Log transaction
            prisma.loyaltyTransaction.create({
                data: {
                    customerId,
                    type: 'REDEEM',
                    points: -pointsToRedeem,
                    amount: discountValue,
                    metadata: {
                        code,
                        discountValue,
                        burnRatio,
                        timestamp: new Date().toISOString()
                    }
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            code,
            discountValue: parseFloat(discountValue.toFixed(2)),
            pointsRedeemed: pointsToRedeem,
            newBalance: updatedCustomer.points,
            message: `${pointsToRedeem} puan kullanıldı. ${discountValue.toFixed(2)}₺ indirim kazandınız!`
        });

    } catch (error) {
        console.error('Widget redeem error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
