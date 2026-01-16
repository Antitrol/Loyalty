/**
 * Get Campaign IDs and Sync All Tiers
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAllTiers() {
    try {
        // Get campaign IDs from settings
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            console.error('❌ No settings found');
            return;
        }

        console.log('📋 Campaign IDs:');
        console.log(`   100 points: ${settings.campaign100Id || 'NOT SET'}`);
        console.log(`   250 points: ${settings.campaign250Id || 'NOT SET'}`);
        console.log(`   500 points: ${settings.campaign500Id || 'NOT SET'}`);
        console.log(`   1000 points: ${settings.campaign1000Id || 'NOT SET'}`);
        console.log('');

        // Sync each tier
        const tiers = [
            { points: 100, campaignId: settings.campaign100Id },
            { points: 250, campaignId: settings.campaign250Id },
            { points: 500, campaignId: settings.campaign500Id },
            { points: 1000, campaignId: settings.campaign1000Id }
        ];

        for (const tier of tiers) {
            if (!tier.campaignId) {
                console.log(`⚠️ Skipping ${tier.points} points (no campaign ID)`);
                continue;
            }

            console.log(`\n🔄 Syncing ${tier.points} points tier...`);

            const response = await fetch('http://localhost:3000/api/admin/sync-coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: tier.campaignId,
                    tier: tier.points,
                    limit: 1000
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`✅ ${tier.points} points: Synced ${data.synced} coupons`);
                console.log(`   Pool: ${data.poolStats.available} available, ${data.poolStats.used} used`);
            } else {
                console.log(`❌ ${tier.points} points: ${data.error}`);
            }
        }

        console.log('\n✅ Sync complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

syncAllTiers();
