import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIkas } from '@/helpers/api-helpers';
import { runAutoSetup, getSetupStatus, SetupProgress } from '@/lib/setup/auto-setup';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for setup

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/admin/auto-setup
 * Run complete automatic setup for marketplace installation
 * 
 * This creates all campaigns, generates coupons, and configures the app
 * WITHOUT any manual intervention!
 */
export async function POST(req: NextRequest) {
    try {
        console.log('🚀 Starting automatic setup...');

        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            return NextResponse.json({
                success: false,
                error: 'No auth token found. Please complete OAuth flow first.'
            }, { status: 500, headers: corsHeaders });
        }

        // Create İKAS client
        const ikasClient = getIkas(authToken as any);

        // Track progress
        const progressUpdates: SetupProgress[] = [];

        const result = await runAutoSetup(ikasClient, (progress) => {
            console.log(`[${progress.completedSteps}/${progress.totalSteps}] ${progress.message}`);
            progressUpdates.push({ ...progress });
        });

        return NextResponse.json({
            success: true,
            status: result.status,
            message: result.message,
            results: result.results,
            progress: progressUpdates
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Auto-setup error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Setup failed'
        }, { status: 500, headers: corsHeaders });
    }
}

/**
 * GET /api/admin/auto-setup
 * Check setup status
 */
export async function GET(req: NextRequest) {
    try {
        const status = await getSetupStatus();

        return NextResponse.json({
            success: true,
            ...status
        }, { headers: corsHeaders });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500, headers: corsHeaders });
    }
}
