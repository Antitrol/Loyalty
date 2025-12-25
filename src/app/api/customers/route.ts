
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        // Auth check...

        const customers = await prisma.loyaltyBalance.findMany({
            orderBy: { points: 'desc' }
        });

        return NextResponse.json(customers);
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
