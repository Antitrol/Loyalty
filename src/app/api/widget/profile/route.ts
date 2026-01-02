import { NextRequest, NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { getLoyaltyProfile } from '@/lib/loyalty/attributes';
import { determineTier } from '@/lib/loyalty/earn';
import { prisma } from '@/lib/prisma';
import { TierConfig } from '@/lib/loyalty/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Get auth token
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            return NextResponse.json({ error: 'No auth token available' }, { status: 500 });
        }
        const client = getIkas(tokens[0]);

        // Get loyalty profile
        const profile = await getLoyaltyProfile(client, customerId);

        if (!profile) {
            // Return default state for new customers
            return NextResponse.json({
                points: 0,
                tier: 'Standard',
                lifetimePoints: 0,
                nextTier: {
                    name: 'Bronze',
                    threshold: 5000,
                    progress: 0,
                    pointsNeeded: 5000
                },
                canRedeem: false,
                maxRedeemablePoints: 0,
                redeemValue: 0,
                settings: {
                    burnRatio: 100,
                    minSpendLimit: 0,
                    label: 'Puan',
                    primaryColor: '#4F46E5'
                }
            });
        }

        // Get settings for tier calculations
        const settings = await prisma.loyaltySettings.findUnique({ where: { id: 'default' } });

        const tiers: TierConfig[] = settings?.tiers as any || [
            { name: 'Standard', threshold: 0, multiplier: 1 },
            { name: 'Bronze', threshold: 5000, multiplier: 1.1 },
            { name: 'Silver', threshold: 10000, multiplier: 1.25 },
            { name: 'Gold', threshold: 25000, multiplier: 1.5 },
            { name: 'Platinum', threshold: 50000, multiplier: 2.0 },
        ];

        // Find next tier
        const currentTierIndex = tiers.findIndex(t => t.name === profile.tier);
        const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

        let nextTierData = null;
        if (nextTier) {
            const progress = Math.min(100, Math.round((profile.lifetimePoints / nextTier.threshold) * 100));
            const pointsNeeded = Math.max(0, nextTier.threshold - profile.lifetimePoints);

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
        const maxPointUsage = settings?.maxPointUsage || profile.pointsBalance;

        const maxRedeemablePoints = Math.min(profile.pointsBalance, maxPointUsage);
        const redeemValue = maxRedeemablePoints / burnRatio;
        const canRedeem = profile.pointsBalance >= burnRatio;

        return NextResponse.json({
            points: profile.pointsBalance,
            tier: profile.tier,
            lifetimePoints: profile.lifetimePoints,
            nextTier: nextTierData,
            canRedeem,
            maxRedeemablePoints,
            redeemValue: parseFloat(redeemValue.toFixed(2)),
            settings: {
                burnRatio,
                minSpendLimit,
                label: settings?.widgetLabel || 'Puan',
                primaryColor: settings?.widgetPrimaryColor || '#4F46E5'
            }
        });

    } catch (error) {
        console.error('Widget profile error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
