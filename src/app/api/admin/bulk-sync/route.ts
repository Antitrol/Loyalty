import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Bulk Sync Coupons Endpoint
 * Accept array of coupons and store in database
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { coupons } = body;

        if (!coupons || !Array.isArray(coupons)) {
            return NextResponse.json({
                success: false,
                error: 'coupons array required'
            }, { status: 400, headers: corsHeaders });
        }

        console.log(`📥 Bulk sync: ${coupons.length} coupons`);

        // Insert all coupons
        const result = await prisma.couponPool.createMany({
            data: coupons,
            skipDuplicates: true
        });

        console.log(`✅ Inserted ${result.count} coupons`);

        return NextResponse.json({
            success: true,
            inserted: result.count,
            total: coupons.length,
            skipped: coupons.length - result.count
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Bulk sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500, headers: corsHeaders });
    }
}
