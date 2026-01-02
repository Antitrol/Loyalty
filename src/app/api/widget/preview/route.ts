import { NextRequest, NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { getLoyaltyProfile } from '@/lib/loyalty/attributes';
import { calculatePoints } from '@/lib/loyalty/earn';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');
        const cartTotalStr = searchParams.get('cartTotal');

        if (!customerId || !cartTotalStr) {
            return NextResponse.json({
                error: 'Customer ID and cart total required'
            }, { status: 400 });
        }

        const cartTotal = parseFloat(cartTotalStr);
        if (isNaN(cartTotal) || cartTotal < 0) {
            return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 });
        }

        // Get auth token
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            return NextResponse.json({ error: 'No auth token available' }, { status: 500 });
        }
        const client = getIkas(tokens[0]);

        // Get loyalty profile for tier
        const profile = await getLoyaltyProfile(client, customerId);
        const currentTier = profile?.tier || 'Standard';

        // Get settings
        const settings = await prisma.loyaltySettings.findUnique({ where: { id: 'default' } });

        const safeSettings = {
            earnPerAmount: settings?.earnPerAmount || 1,
            earnUnitAmount: settings?.earnUnitAmount || 1,
            earnRatio: settings?.earnRatio || 0,
            tiers: settings?.tiers as any || [
                { name: 'Standard', threshold: 0, multiplier: 1 },
                { name: 'Bronze', threshold: 5000, multiplier: 1.1 },
                { name: 'Silver', threshold: 10000, multiplier: 1.25 },
                { name: 'Gold', threshold: 25000, multiplier: 1.5 },
                { name: 'Platinum', threshold: 50000, multiplier: 2.0 },
            ]
        };

        // Calculate points
        const pointsToEarn = calculatePoints(cartTotal, currentTier, safeSettings);

        // Get tier multiplier
        const tierData = safeSettings.tiers.find((t: any) => t.name === currentTier);
        const tierMultiplier = tierData?.multiplier || 1;

        return NextResponse.json({
            pointsToEarn,
            tierMultiplier,
            cartTotal,
            tier: currentTier,
            calculation: {
                basePoints: Math.floor(cartTotal / safeSettings.earnUnitAmount * safeSettings.earnPerAmount),
                withMultiplier: pointsToEarn
            }
        });

    } catch (error) {
        console.error('Widget preview error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
