
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        // Auth check...

        const customerId = params.id;
        const body = await req.json();
        const { points, reason } = body; // points can be negative for deduction

        if (!customerId || points === undefined) {
            return NextResponse.json({ error: 'Missing customerId or points' }, { status: 400 });
        }

        const adjustmentAmount = parseInt(points);
        if (isNaN(adjustmentAmount)) {
            return NextResponse.json({ error: 'Points must be a number' }, { status: 400 });
        }

        // Transaction
        await prisma.$transaction([
            prisma.loyaltyTransaction.create({
                data: {
                    customerId,
                    type: 'MANUAL',
                    points: adjustmentAmount,
                    amount: 0,
                    metadata: {
                        reason: reason || 'Manual Adjustment',
                        adminUser: 'Admin' // Placeholder for real admin user
                    }
                }
            }),
            prisma.loyaltyBalance.upsert({
                where: { customerId },
                create: {
                    customerId,
                    points: adjustmentAmount
                },
                update: {
                    points: { increment: adjustmentAmount }
                }
            })
        ]);

        return NextResponse.json({ success: true, adjusted: adjustmentAmount });

    } catch (error: any) {
        console.error('Adjustment failed:', error);
        return NextResponse.json({ error: 'Failed to adjust points' }, { status: 500 });
    }
}
