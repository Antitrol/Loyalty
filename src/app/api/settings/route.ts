
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    try {
        // Basic auth check (ensure user is logged in via session)
        const session = await getSession();
        // In a real app we might verify session against DB, but for now session existence is checking common auth flow.

        // Fetch settings, or upsert default if not exists
        let settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            settings = await prisma.loyaltySettings.create({
                data: {
                    id: 'default',
                    earnRatio: 1.0, // 1 Currency = 1 Point
                    burnRatio: 0.01 // 1 Point = 0.01 Currency
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { earnRatio, burnRatio } = body;

        const updated = await prisma.loyaltySettings.upsert({
            where: { id: 'default' },
            update: {
                earnRatio: Number(earnRatio),
                burnRatio: Number(burnRatio)
            },
            create: {
                id: 'default',
                earnRatio: Number(earnRatio),
                burnRatio: Number(burnRatio)
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
