import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * DIAGNOSTIC ENDPOINT - Database Pool Analysis
 * GET /api/admin/diagnostic/pool
 * 
 * Shows actual database structure to debug query issues
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Get total coupons
        const totalCoupons = await prisma.couponPool.count();

        // 2. Group by tier  
        const byTier = await prisma.couponPool.groupBy({
            by: ['tier'],
            _count: { _all: true },
            where: { usedAt: null }
        });

        // 3. Group by campaignId
        const byCampaign = await prisma.couponPool.groupBy({
            by: ['campaignId'],
            _count: { _all: true },
            where: { usedAt: null }
        });

        // 4. Group by BOTH tier and campaignId
        const byBoth = await prisma.couponPool.groupBy({
            by: ['tier', 'campaignId'],
            _count: { _all: true },
            where: { usedAt: null }
        });

        // 5. Get sample coupons (first 10)
        const samples = await prisma.couponPool.findMany({
            take: 10,
            where: { usedAt: null },
            select: {
                code: true,
                campaignId: true,
                tier: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // 6. Check what campaign IDs are in settings
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' },
            select: {
                campaign100Id: true,
                campaign250Id: true,
                campaign500Id: true,
                campaign1000Id: true
            }
        });

        return NextResponse.json({
            success: true,
            totalCoupons,
            breakdown: {
                byTier: byTier.map(g => ({
                    tier: g.tier,
                    count: g._count._all
                })),
                byCampaignId: byCampaign.map(g => ({
                    campaignId: g.campaignId.substring(0, 20) + '...',
                    fullId: g.campaignId,
                    count: g._count._all
                })),
                byBoth: byBoth.map(g => ({
                    tier: g.tier,
                    campaignId: g.campaignId.substring(0, 20) + '...',
                    fullId: g.campaignId,
                    count: g._count._all
                }))
            },
            samples,
            settingsCampaignIds: settings
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
