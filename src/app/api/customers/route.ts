
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtHelpers } from '@/helpers/jwt-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('JWT ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const payload = JwtHelpers.verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const customers = await prisma.loyaltyBalance.findMany({
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(customers);
    } catch (error: any) {
        console.error('Customers GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
