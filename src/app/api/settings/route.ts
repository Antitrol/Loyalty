
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

        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        console.log("📥 GET Settings from DB:", JSON.stringify(settings));

        // Return default empty object with defaults if null, or just let frontend handle it
        // Prisma "create" defaults only apply on insert, so we might return null if not created yet.
        // Let's return defaults if null.
        if (!settings) {
            return NextResponse.json({
                earnPerAmount: 1.0,
                earnUnitAmount: 1.0,
                welcomeBonus: 0,
                categoryBonuses: {}
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        console.log("🔥 POST Body:", body);

        // Clean body
        const { id, updatedAt, ...data } = body;

        // Type casting/validation basic
        if (typeof data.welcomeBonus === 'string') data.welcomeBonus = parseInt(data.welcomeBonus);
        if (typeof data.earnPerAmount === 'string') data.earnPerAmount = parseFloat(data.earnPerAmount);
        if (typeof data.earnUnitAmount === 'string') data.earnUnitAmount = parseFloat(data.earnUnitAmount);

        console.log("🛠️ Data to upsert:", data);

        const settings = await prisma.loyaltySettings.upsert({
            where: { id: 'default' },
            update: data,
            create: {
                id: 'default',
                ...data
            }
        });

        console.log("✅ Upsert Success:", settings);
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('❌ Settings POST error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
