import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Manual Coupon Import Endpoint
 * Import existing İKAS campaign coupons into database
 * 
 * POST /api/admin/import-coupons
 * Body: {
 *   "secret": "YOUR_SECRET",
 *   "campaignId": "2bc1f3dc-...",
 *   "tier": 500,
 *   "codes": ["l-e4d2w0apif", "l-sng9z8yizn", ...]
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { secret, campaignId, tier, codes } = body;

        // Simple security
        if (secret !== process.env.ADMIN_SECRET && secret !== process.env.SECRET_COOKIE_PASSWORD) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        if (!campaignId || !tier || !codes || !Array.isArray(codes)) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: campaignId, tier, codes'
            }, { status: 400 });
        }

        console.log(`📥 Importing ${codes.length} coupons for tier ${tier}...`);

        // Import to database
        const result = await prisma.couponPool.createMany({
            data: codes.map(code => ({
                code,
                campaignId,
                tier
            })),
            skipDuplicates: true
        });

        console.log(`✅ Imported ${result.count} coupons`);

        return NextResponse.json({
            success: true,
            imported: result.count,
            skipped: codes.length - result.count
        });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
