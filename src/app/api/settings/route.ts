
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtHelpers } from '@/helpers/jwt-helpers';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

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

        let settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        console.log("📥 GET Settings from DB:", JSON.stringify(settings));

        // If no settings exist, create default settings automatically
        if (!settings) {
            console.log("⚠️ No settings found, creating default settings...");
            settings = await prisma.loyaltySettings.create({
                data: {
                    id: 'default',
                    earnPerAmount: 1.0,
                    earnUnitAmount: 1.0,
                    earnRatio: 1.0,
                    welcomeBonus: 0,
                    excludeShipping: false,
                    excludeDiscounted: false,
                    categoryBonuses: {},
                    tiers: [],
                    burnRatio: 0.01,
                    minSpendLimit: 0,
                    maxPointUsage: 0,
                    widgetPrimaryColor: '#4F46E5',
                    widgetSecondaryColor: '#818CF8',
                    widgetLabel: 'Puan',
                    widgetTheme: 'light',
                    widgetPosition: 'bottom-right',
                    widgetStyle: 'default',
                    widgetAnimations: true,
                    widgetAutoExpand: false,
                    widgetBorderRadius: 16,
                    widgetShadowIntensity: 'medium'
                } as any
            });
            console.log("✅ Default settings created:", settings);
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
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500, headers: corsHeaders });
    }
}

// PUT is same as POST
export const PUT = POST;
