import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIkas } from '@/helpers/api-helpers';
import { syncCouponsFromIKAS, checkCampaignCoupons } from '@/lib/loyalty/coupon-sync';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Admin Sync Coupons Endpoint
 * Manually sync coupons from İKAS campaigns to database pool
 * 
 * POST /api/admin/sync-coupons
 * Body: { campaignId, tier, limit? }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { campaignId, tier, limit } = body;

        // Validation
        if (!campaignId) {
            return NextResponse.json({
                success: false,
                error: 'campaignId required'
            }, { status: 400 });
        }

        if (!tier || ![100, 250, 500, 1000].includes(tier)) {
            return NextResponse.json({
                success: false,
                error: 'tier must be 100, 250, 500, or 1000'
            }, { status: 400 });
        }

        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            return NextResponse.json({
                success: false,
                error: 'No auth token available'
            }, { status: 500 });
        }

        // Create İKAS client
        const ikasClient = getIkas(authToken as any);

        // Check campaign status
        const campaignStatus = await checkCampaignCoupons(ikasClient, campaignId);
        console.log(`Campaign ${campaignId} status:`, campaignStatus);

        // Sync coupons
        const synced = await syncCouponsFromIKAS(
            ikasClient,
            campaignId,
            tier,
            limit || 1000
        );

        // Get pool stats
        const { getCouponPoolStats } = await import('@/lib/loyalty/coupon-pool');
        const stats = await getCouponPoolStats(campaignId, tier);

        return NextResponse.json({
            success: true,
            synced,
            campaignStatus,
            poolStats: stats,
            message: `Successfully synced ${synced} coupons from İKAS`
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Admin sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500, headers: corsHeaders });
    }
}

/**
 * GET endpoint to check sync status
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaignId');
        const tier = parseInt(searchParams.get('tier') || '0');

        if (!campaignId || !tier) {
            return NextResponse.json({
                success: false,
                error: 'campaignId and tier required'
            }, { status: 400 });
        }

        // Get pool stats
        const { getCouponPoolStats } = await import('@/lib/loyalty/coupon-pool');
        const stats = await getCouponPoolStats(campaignId, tier);

        return NextResponse.json({
            success: true,
            campaignId,
            tier,
            stats
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
