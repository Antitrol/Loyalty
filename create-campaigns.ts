/**
 * Campaign initialization script
 * Creates 4 predefined campaigns for loyalty redemption tiers
 */

import { getIkas } from './src/helpers/api-helpers';
import { prisma } from './src/lib/prisma';
import { initializeAllCampaigns } from './src/lib/loyalty/campaign-tiers';

async function main() {
    console.log('🚀 İKAS Campaign Initialization Starting...\n');

    // Get auth token
    const authToken = await prisma.authToken.findFirst({
        where: { deleted: false },
        orderBy: { createdAt: 'desc' }
    });

    if (!authToken) {
        throw new Error('❌ No auth token found. Please authenticate first.');
    }

    const client = getIkas(authToken);

    // Initialize all tier campaigns
    await initializeAllCampaigns(client);

    // Display results
    const settings = await prisma.loyaltySettings.findUnique({
        where: { id: 'default' }
    });

    console.log('\n📊 Campaign Mapping:');
    console.log(`  100 points  = ${settings?.campaign100Id || 'Not set'}`);
    console.log(`  250 points  = ${settings?.campaign250Id || 'Not set'}`);
    console.log(`  500 points  = ${settings?.campaign500Id || 'Not set'}`);
    console.log(`  1000 points = ${settings?.campaign1000Id || 'Not set'}`);
    console.log('\n✅ Setup complete!\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
