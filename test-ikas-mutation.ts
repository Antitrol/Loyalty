/**
 * Test İKAS generateCampaignCoupons mutation
 * This will help us verify if the mutation actually works
 */

import { getIkas } from './src/helpers/api-helpers';
import { prisma } from './src/lib/prisma';
import { GENERATE_COUPONS } from './src/lib/graphql/rewards';

async function testMutation() {
    console.log('🧪 Testing İKAS generateCampaignCoupons mutation...\n');

    try {
        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            throw new Error('No auth token found');
        }

        console.log('✅ Auth token found');

        // Get campaign ID (100 points tier)
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        const campaignId = settings?.campaign100Points;

        if (!campaignId) {
            throw new Error('No campaign ID found for 100 points tier');
        }

        console.log(`✅ Campaign ID: ${campaignId}\n`);

        // Create İKAS client
        const ikasClient = getIkas(authToken as any);

        console.log('📞 Calling İKAS mutation with:');
        console.log(`   - campaignId: ${campaignId}`);
        console.log(`   - count: 10`);
        console.log(`   - prefix: "test-"`);
        console.log('');

        // Call mutation with small count for testing
        const result = await ikasClient.mutate({
            mutation: GENERATE_COUPONS,
            variables: {
                campaignId,
                count: 10,
                prefix: 'test-'
            }
        });

        console.log('📊 MUTATION RESPONSE:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');

        // Check result
        const success = result.data?.generateCampaignCoupons?.success;
        const count = result.data?.generateCampaignCoupons?.count;
        const errors = result.errors;

        console.log('📋 PARSED RESULTS:');
        console.log(`   - Success: ${success}`);
        console.log(`   - Count: ${count}`);
        console.log(`   - Errors: ${errors ? JSON.stringify(errors) : 'None'}`);
        console.log('');

        if (errors) {
            console.log('❌ MUTATION FAILED - Errors found in response');
            console.log('This means İKAS does NOT support this mutation or parameters are wrong');
        } else if (success && count > 0) {
            console.log('✅ MUTATION SUCCESS - İKAS created coupons!');
            console.log('');
            console.log('🎯 NEXT STEPS:');
            console.log('1. Check İKAS Admin Panel → "Sadakat İndirimi - 5 TL"');
            console.log('2. Verify coupon count increased by 10');
            console.log('3. If YES: mutation works, we need to fetch generated codes');
            console.log('4. If NO: mutation claims success but doesn\'t work');
        } else {
            console.log('⚠️ UNEXPECTED RESPONSE - Check data structure');
        }

    } catch (error: any) {
        console.error('❌ TEST FAILED:');
        console.error(error.message);
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
    }
}

testMutation();
