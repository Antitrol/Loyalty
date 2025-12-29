
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
    try {
        // JWT authentication check
        const user = getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const customers = await prisma.loyaltyBalance.findMany({
            orderBy: { points: 'desc' }
        });

        return NextResponse.json(customers);
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
