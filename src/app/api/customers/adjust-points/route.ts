import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIkas } from '@/helpers/api-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';

export const dynamic = 'force-dynamic';

/**
 * Adjust customer points (add or remove)
 * Admin only - requires auth token
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, points, reason, type } = body;

        // Validation
        if (!customerId) {
            return NextResponse.json({
                success: false,
                error: 'Customer ID is required'
            }, { status: 400 });
        }

        if (typeof points !== 'number' || points === 0) {
            return NextResponse.json({
                success: false,
                error: 'Points must be a non-zero number'
            }, { status: 400 });
        }

        if (!type || !['MANUAL_ADD', 'MANUAL_REMOVE', 'ADJUSTMENT'].includes(type)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid transaction type'
            }, { status: 400 });
        }

        // Get customer balance
        const customer = await prisma.loyaltyBalance.findUnique({
            where: { customerId }
        });

        if (!customer) {
            return NextResponse.json({
                success: false,
                error: 'Customer not found in loyalty system'
            }, { status: 404 });
        }

        // Check if removing more points than available
        if (points < 0 && customer.points < Math.abs(points)) {
            return NextResponse.json({
                success: false,
                error: 'Insufficient points',
                currentPoints: customer.points,
                requestedPoints: Math.abs(points)
            }, { status: 400 });
        }

        // Calculate new balance
        const newBalance = customer.points + points;

        // Start transaction - update balance and log transaction
        const [updatedCustomer, transaction] = await prisma.$transaction([
            // Update points
            prisma.loyaltyBalance.update({
                where: { customerId },
                data: {
                    points: newBalance
                }
            }),
            // Log transaction
            prisma.loyaltyTransaction.create({
                data: {
                    customerId,
                    type,
                    points,
                    amount: null,
                    metadata: {
                        reason: reason || 'Manual adjustment',
                        previousBalance: customer.points,
                        newBalance,
                        timestamp: new Date().toISOString()
                    }
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            newBalance: updatedCustomer.points,
            previousBalance: customer.points,
            pointsAdjusted: points,
            transaction: {
                id: transaction.id,
                type: transaction.type,
                points: transaction.points,
                createdAt: transaction.createdAt
            },
            message: `${Math.abs(points)} puan ${points > 0 ? 'eklendi' : 'çıkarıldı'}`
        });

    } catch (error) {
        console.error('Adjust points error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
