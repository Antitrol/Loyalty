import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIkas } from '@/helpers/api-helpers';
import { getTierByPoints, getCampaignIdForPoints, ensureTierCampaign } from '@/lib/loyalty/campaign-tiers';

export const dynamic = 'force-dynamic';

/**
 * Widget Redeem Endpoint - Tier-based redemption with İKAS coupon integration
 * Creates real İKAS coupon codes for predefined point tiers (100, 250, 500, 1000)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, pointsToRedeem } = body;

        // Validation
        if (!customerId) {
            return NextResponse.json({
                success: false,
                error: 'Customer ID required'
            }, { status: 400 });
        }

        if (!pointsToRedeem || pointsToRedeem <= 0) {
            return NextResponse.json({
                success: false,
                error: 'Invalid points amount'
            }, { status: 400 });
        }

        // Validate tier
        const tier = getTierByPoints(pointsToRedeem);
        if (!tier) {
            return NextResponse.json({
                success: false,
                error: `Invalid redemption amount. Please choose 100, 250, 500, or 1000 points.`
            }, { status: 400 });
        }

        // Get customer balance
        const customer = await prisma.loyaltyBalance.findUnique({
            where: { customerId }
        });

        if (!customer) {
            return NextResponse.json({
                success: false,
                error: 'Customer not found'
            }, { status: 404 });
        }

        // Check if sufficient points
        if (customer.points < pointsToRedeem) {
            return NextResponse.json({
                success: false,
                error: 'Insufficient points',
                currentPoints: customer.points,
                requiredPoints: pointsToRedeem
            }, { status: 400 });
        }

        // Get or create campaign for this tier
        let campaignId = await getCampaignIdForPoints(pointsToRedeem);

        // If no campaign exists, try to create one
        if (!campaignId) {
            console.log(`⚠️ No campaign found for ${pointsToRedeem} points, attempting to create...`);

            const settings = await prisma.loyaltySettings.findUnique({
                where: { id: 'default' }
            });

            if (!settings?.autoCreateCampaigns) {
                return NextResponse.json({
                    success: false,
                    error: 'Campaign not configured. Please contact administrator.'
                }, { status: 500 });
            }

            // Get auth token for İKAS API
            const authToken = await prisma.authToken.findFirst({
                where: { deleted: false },
                orderBy: { createdAt: 'desc' }
            });

            if (!authToken) {
                console.error('❌ No auth token found for campaign creation');
                return NextResponse.json({
                    success: false,
                    error: 'Service configuration error. Please contact administrator.'
                }, { status: 500 });
            }

            // Create İKAS GraphQL client (cast Prisma model to interface)
            const ikasClient = getIkas(authToken as any);

            try {
                campaignId = await ensureTierCampaign(ikasClient, tier);

                // Save campaign ID to settings
                const updateData = { [tier.field]: campaignId };
                await prisma.loyaltySettings.upsert({
                    where: { id: 'default' },
                    update: updateData,
                    create: { id: 'default', ...updateData }
                });

                console.log(`✅ Created and saved campaign: ${campaignId}`);
            } catch (campaignError) {
                console.error('❌ Failed to create campaign:', campaignError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create discount campaign. Please try again later.'
                }, { status: 500 });
            }
        }

        if (!campaignId) {
            return NextResponse.json({
                success: false,
                error: 'Campaign configuration missing. Please contact administrator.'
            }, { status: 500 });
        }

        // Get unused coupon from database pool
        const { getUnusedCouponFromPool, getCouponPoolStats } = await import('@/lib/loyalty/coupon-pool');

        // Check if pool needs initialization
        const poolStats = await getCouponPoolStats(campaignId, pointsToRedeem);

        if (poolStats.available === 0) {
            console.log(`🔧 Pool empty for tier ${pointsToRedeem}, auto-initializing...`);

            // Generate 5000 coupons
            const batchSize = 5000;
            const codes = [];
            for (let i = 0; i < batchSize; i++) {
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 10);
                const code = `l-${timestamp}${random}`.substring(0, 15);
                codes.push(code);
            }

            // Store in database
            try {
                const result = await prisma.couponPool.createMany({
                    data: codes.map(code => ({
                        code,
                        campaignId,
                        tier: pointsToRedeem
                    })),
                    skipDuplicates: true
                });

                console.log(`✅ Auto-initialized pool with ${result.count} coupons`);
            } catch (initError: any) {
                console.error('❌ Auto-init failed:', initError.message);
                return NextResponse.json({
                    success: false,
                    error: `Failed to initialize coupon pool: ${initError.message}`
                }, { status: 500 });
            }
        }

        let code: string | null;
        try {
            code = await getUnusedCouponFromPool(campaignId, pointsToRedeem);

            if (!code) {
                console.error('❌ No coupons available in pool after initialization');
                return NextResponse.json({
                    success: false,
                    error: `Coupon pool depleted for ${pointsToRedeem} points tier. Please contact support.`
                }, { status: 500 });
            }

            console.log(`✅ Fetched coupon from pool: ${code}`);
        } catch (poolError: any) {
            console.error('❌ Pool fetch error:', poolError.message);
            return NextResponse.json({
                success: false,
                error: `Unable to fetch coupon: ${poolError.message}`
            }, { status: 500 });
        }

        // Start transaction - update balance and log redemption
        const [updatedCustomer, transaction] = await prisma.$transaction([
            // Deduct points
            prisma.loyaltyBalance.update({
                where: { customerId },
                data: {
                    points: customer.points - pointsToRedeem
                }
            }),
            // Log transaction
            prisma.loyaltyTransaction.create({
                data: {
                    customerId,
                    type: 'REDEEM',
                    points: -pointsToRedeem,
                    amount: tier.amount,
                    metadata: {
                        code,
                        discountValue: tier.amount,
                        campaignId,
                        tier: tier.points,
                        timestamp: new Date().toISOString()
                    }
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            code,
            discountValue: tier.amount,
            pointsRedeemed: pointsToRedeem,
            newBalance: updatedCustomer.points,
            message: `${pointsToRedeem} puan kullanıldı. ${tier.amount.toFixed(2)}₺ indirim kazandınız!`
        });

    } catch (error) {
        console.error('Widget redeem error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
