import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIkas } from '@/helpers/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * Initialize Coupon Pools
 * One-time setup endpoint to populate database with coupons
 * 
 * Usage: GET /api/admin/initialize-pools?secret=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
    try {
        // Simple security - check secret parameter
        const secret = req.nextUrl.searchParams.get('secret');
        if (secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        console.log('🎫 Starting pool initialization...');

        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            return NextResponse.json({
                success: false,
                error: 'No auth token found'
            }, { status: 500 });
        }

        // Get loyalty settings
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            return NextResponse.json({
                success: false,
                error: 'No loyalty settings found'
            }, { status: 500 });
        }

        const tiers = [
            { points: 100, campaignId: settings.campaign100Id },
            { points: 250, campaignId: settings.campaign250Id },
            { points: 500, campaignId: settings.campaign500Id },
            { points: 1000, campaignId: settings.campaign1000Id }
        ];

        const results = [];

        for (const tier of tiers) {
            if (!tier.campaignId) {
                results.push({
                    tier: tier.points,
                    status: 'skipped',
                    message: 'No campaign ID configured'
                });
                continue;
            }

            // Check existing pool
            const existingCount = await prisma.couponPool.count({
                where: {
                    campaignId: tier.campaignId,
                    tier: tier.points,
                    usedAt: null
                }
            });

            if (existingCount >= 100) {
                results.push({
                    tier: tier.points,
                    status: 'ok',
                    existing: existingCount,
                    message: 'Pool has enough coupons'
                });
                continue;
            }

            // Generate coupons
            const batchSize = 5000;
            console.log(`Generating ${batchSize} coupons for ${tier.points} points...`);

            const codes = [];
            for (let i = 0; i < batchSize; i++) {
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 10);
                const code = `l-${timestamp}${random}`.substring(0, 15);
                codes.push(code);
            }

            // Store in database
            const result = await prisma.couponPool.createMany({
                data: codes.map(code => ({
                    code,
                    campaignId: tier.campaignId!,
                    tier: tier.points
                })),
                skipDuplicates: true
            });

            const newTotal = await prisma.couponPool.count({
                where: {
                    campaignId: tier.campaignId,
                    tier: tier.points,
                    usedAt: null
                }
            });

            results.push({
                tier: tier.points,
                status: 'generated',
                created: result.count,
                total: newTotal
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Pool initialization complete',
            results
        });

    } catch (error: any) {
        console.error('Pool initialization error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
