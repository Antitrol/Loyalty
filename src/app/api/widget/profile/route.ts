import { NextRequest, NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { getLoyaltyProfile } from '@/lib/loyalty/attributes';
import { determineTier } from '@/lib/loyalty/earn';
import { prisma } from '@/lib/prisma';
import { TierConfig } from '@/lib/loyalty/types';
import { LoyaltySettings } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Get customer loyalty balance from database (no auth needed for public widget)
        const customer = await prisma.loyaltyBalance.findUnique({
            where: { customerId }
        });

        const points = customer?.points || 0;
        const lifetimePoints = points; // For now, assume lifetime = current

        // Get settings
        const settings = await prisma.loyaltySettings.findUnique({ where: { id: 'default' } });

        const tiers: TierConfig[] = (settings?.tiers as unknown as TierConfig[]) || [
            { name: 'Standard', threshold: 0, multiplier: 1 },
            { name: 'Bronze', threshold: 5000, multiplier: 1.1 },
            { name: 'Silver', threshold: 10000, multiplier: 1.25 },
            { name: 'Gold', threshold: 25000, multiplier: 1.5 },
            { name: 'Platinum', threshold: 50000, multiplier: 2.0 },
        ];

        // Determine tier based on points
        const tier = determineTier(lifetimePoints, { tiers } as unknown as Partial<LoyaltySettings>);

        // Find next tier
        const currentTierIndex = tiers.findIndex(t => t.name === tier);
        const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

        let nextTierData = null;
        if (nextTier) {
            const progress = Math.min(100, Math.round((lifetimePoints / nextTier.threshold) * 100));
            const pointsNeeded = Math.max(0, nextTier.threshold - lifetimePoints);

            nextTierData = {
                name: nextTier.name,
                threshold: nextTier.threshold,
                progress,
                pointsNeeded
            };
        }


        // Calculate redemption value
        const burnRatio = settings?.burnRatio || 100; // 100 points = 1 TL default
        const minSpendLimit = settings?.minSpendLimit || 0;
        const maxPointUsage = settings?.maxPointUsage || points;

        const maxRedeemablePoints = Math.min(points, maxPointUsage);
        const redeemValue = maxRedeemablePoints / burnRatio;
        const canRedeem = points >= burnRatio;

        return NextResponse.json({
            points,
            tier,
            lifetimePoints,
            nextTier: nextTierData,
            canRedeem,
            maxRedeemablePoints,
            redeemValue: parseFloat(redeemValue.toFixed(2)),
            settings: {
                burnRatio,
                minSpendLimit,
                label: (settings as any)?.widgetLabel || 'Puan',
                primaryColor: (settings as any)?.widgetPrimaryColor || '#4F46E5',
                secondaryColor: (settings as any)?.widgetSecondaryColor || '#818CF8',
                theme: (settings as any)?.widgetTheme || 'light',
                position: (settings as any)?.widgetPosition || 'bottom-right',
                style: (settings as any)?.widgetStyle || 'default',
                animations: (settings as any)?.widgetAnimations ?? true,
                autoExpand: (settings as any)?.widgetAutoExpand ?? false,
                borderRadius: (settings as any)?.widgetBorderRadius || 16,
                shadowIntensity: (settings as any)?.widgetShadowIntensity || 'medium'
            }
        });

    } catch (error) {
        console.error('Widget profile error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
