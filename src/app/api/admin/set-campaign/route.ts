import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Simple endpoint to set campaign IDs
 * No auth required for easier testing
 */
export async function POST(req: NextRequest) {
    try {
        const { tier, campaignId } = await req.json();

        if (!tier || !campaignId) {
            return NextResponse.json({
                success: false,
                error: 'tier and campaignId required'
            }, { status: 400, headers: corsHeaders });
        }

        // Map tier to field name
        const fieldMap: any = {
            100: 'campaign100Id',
            250: 'campaign250Id',
            500: 'campaign500Id',
            1000: 'campaign1000Id'
        };

        const field = fieldMap[tier];
        if (!field) {
            return NextResponse.json({
                success: false,
                error: 'tier must be 100, 250, 500, or 1000'
            }, { status: 400, headers: corsHeaders });
        }

        // Update settings
        const settings = await prisma.loyaltySettings.upsert({
            where: { id: 'default' },
            update: { [field]: campaignId },
            create: {
                id: 'default',
                [field]: campaignId
            }
        });

        console.log(`✅ Updated ${field} = ${campaignId}`);

        return NextResponse.json({
            success: true,
            tier,
            campaignId,
            message: `Campaign ID for ${tier} points tier updated successfully`
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Set campaign error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500, headers: corsHeaders });
    }
}
