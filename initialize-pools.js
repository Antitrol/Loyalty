/**
 * Initialize Coupon Pools
 * Run this script to generate initial coupon pools for all tiers
 * 
 * Usage: node initialize-pools.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import after prisma client is ready
async function initializePools() {
    try {
        console.log('\n🎫 COUPON POOL INITIALIZATION\n');
        console.log('================================\n');

        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            console.error('❌ No auth token found. Please set up integration first.');
            await prisma.$disconnect();
            process.exit(1);
        }

        console.log('\u221A Auth token found\n');

        // Get loyalty settings with campaign IDs
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            console.error('❌ No loyalty settings found. Please configure campaigns first.');
            await prisma.$disconnect();
            process.exit(1);
        }

        const tiers = [
            { points: 100, campaignId: settings.campaign100Id },
            { points: 250, campaignId: settings.campaign250Id },
            { points: 500, campaignId: settings.campaign500Id },
            { points: 1000, campaignId: settings.campaign1000Id }
        ];

        console.log('📋 TIER CONFIGURATION:\n');
        tiers.forEach(tier => {
            const status = tier.campaignId ? '✅ Configured' : '❌ Missing';
            console.log(`   ${tier.points} points: ${status} ${tier.campaignId || ''}`);
        });
        console.log('');

        // Generate pools for each configured tier
        for (const tier of tiers) {
            if (!tier.campaignId) {
                console.log(`⏭️  Skipping ${tier.points} points tier (no campaign ID)\n`);
                continue;
            }

            console.log(`\n🔧 Initializing pool for ${tier.points} points tier...`);
            console.log(`   Campaign ID: ${tier.campaignId}`);

            // Check existing pool
            const existingCount = await prisma.couponPool.count({
                where: {
                    campaignId: tier.campaignId,
                    tier: tier.points
                }
            });

            const unusedCount = await prisma.couponPool.count({
                where: {
                    campaignId: tier.campaignId,
                    tier: tier.points,
                    usedAt: null
                }
            });

            console.log(`   Existing coupons: ${existingCount} (${unusedCount} unused)`);

            if (unusedCount >= 100) {
                console.log(`   ✅ Pool has enough coupons, skipping\n`);
                continue;
            }

            // Generate coupons
            const batchSize = 5000;
            console.log(`   ⚙️  Generating ${batchSize} coupons...`);

            const codes = [];
            for (let i = 0; i < batchSize; i++) {
                // Generate unique code  similar to İKAS format
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 10);
                const code = `l-${timestamp}${random}`.substring(0, 15);
                codes.push(code);
            }

            // Store in database
            const result = await prisma.couponPool.createMany({
                data: codes.map(code => ({
                    code,
                    campaignId: tier.campaignId,
                    tier: tier.points
                })),
                skipDuplicates: true
            });

            console.log(`   ✅ Stored ${result.count} coupons in database`);

            // Verify
            const newTotal = await prisma.couponPool.count({
                where: {
                    campaignId: tier.campaignId,
                    tier: tier.points,
                    usedAt: null
                }
            });

            console.log(`   📊 Total unused coupons: ${newTotal}\n`);
        }

        console.log('\n================================');
        console.log('✅ POOL INITIALIZATION COMPLETE\n');

        await prisma.$disconnect();

    } catch (error) {
        console.error('\n❌ INITIALIZATION FAILED:', error.message);
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

initializePools();
