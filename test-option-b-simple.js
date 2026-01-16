/**
 * Test: Create Campaign with Coupons (Option B) - Ultra Simplified
 * Direct database access version
 */

const { config: loadEnv } = require('dotenv');
loadEnv();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateCampaign() {
    console.log('🧪 Testing Option B: Automated Campaign Creation\n');
    console.log('='.repeat(60));
    console.log('');

    try {
        // Step 1: Get auth token from database
        console.log('📋 Step 1: Getting auth token from database...\n');

        const token = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!token) {
            console.log('❌ No auth token found in database');
            console.log('   Please authenticate with İKAS first');
            return;
        }

        console.log('✅ Auth token found');
        console.log(`   Store ID: ${token.storeId}`);
        console.log('');

        // Step 2: Check available mutations
        console.log('📋 Step 2: Checking available campaign mutations...\n');

        const introspectionQuery = `
      query IntrospectMutations {
        __schema {
          mutationType {
            fields {
              name
            }
          }
        }
      }
    `;

        const response = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.accessToken}`
            },
            body: JSON.stringify({ query: introspectionQuery })
        });

        const data = await response.json();

        if (data.errors) {
            console.log('❌ GraphQL error:', data.errors[0].message);
            await prisma.$disconnect();
            return;
        }

        const mutations = data.data.__schema.mutationType.fields;
        const campaignMutations = mutations
            .filter(m => m.name.toLowerCase().includes('campaign'))
            .map(m => m.name);

        console.log('✅ Found campaign-related mutations:');
        campaignMutations.forEach(m => console.log(`   - ${m}`));
        console.log('');

        const createMutationName = campaignMutations.find(m =>
            m.toLowerCase().includes('create')
        );

        if (!createMutationName) {
            console.log('❌ No createCampaign mutation found!');
            console.log('   Available mutations:', campaignMutations.join(', '));
            console.log('');
            console.log('⚠️  OPTION B IS NOT VIABLE');
            console.log('   → Must wait for İKAS support response');
            console.log('');
            await prisma.$disconnect();
            return;
        }

        console.log(`✅ CREATE mutation found: ${createMutationName}`);
        console.log('');

        // Step 3: Get mutation input schema
        console.log('📋 Step 3: Getting input schema...\n');

        const schemaQuery = `
      query {
        __type(name: "CreateCampaignInput") {
          inputFields {
            name
            type {
              name
              kind
              ofType {
                name
              }
            }
          }
        }
      }
    `;

        const schemaResponse = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.accessToken}`
            },
            body: JSON.stringify({ query: schemaQuery })
        });

        const schemaData = await schemaResponse.json();

        if (!schemaData.errors && schemaData.data.__type) {
            const fields = schemaData.data.__type.inputFields;

            const required = fields.filter(f => f.type.kind === 'NON_NULL');
            const couponFields = fields.filter(f => f.name.toLowerCase().includes('coupon'));

            console.log('✅ Schema retrieved');
            console.log(`   Total fields: ${fields.length}`);
            console.log(`   Required: ${required.map(f => f.name).join(', ')}`);
            console.log(`   Coupon-related: ${couponFields.map(f => f.name).join(', ') || 'None'}`);
            console.log('');
        }

        // Step 4: Create TEST campaign
        console.log('📋 Step 4: Creating TEST campaign...\n');

        const testId = Math.random().toString(36).substring(2, 8);
        const createMutation = `
      mutation CreateTest($input: CreateCampaignInput!) {
        ${createMutationName}(input: $input) {
          id
          title
          type
          hasCoupon
          couponPrefix
        }
      }
    `;

        // Minimal input - İKAS will tell us what's required
        const campaignInput = {
            title: `[TEST-AUTOMATE] Loyalty ${testId}`,
            type: "FIXED_AMOUNT",
            hasCoupon: true,
            isActive: false
        };

        console.log(`   Campaign: "${campaignInput.title}"`);
        console.log('   Attempting creation...');
        console.log('');

        const createResponse = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.accessToken}`
            },
            body: JSON.stringify({
                query: createMutation,
                variables: { input: campaignInput }
            })
        });

        const createData = await createResponse.json();

        console.log('='.repeat(60));
        console.log('📊 RESULT\n');

        if (createData.errors) {
            console.log('❌ Campaign creation FAILED\n');
            console.log('Error:', createData.errors[0].message);
            console.log('');

            if (createData.errors[0].message.toLowerCase().includes('permission') ||
                createData.errors[0].message.toLowerCase().includes('scope') ||
                createData.errors[0].message.toLowerCase().includes('unauthorized')) {
                console.log('⚠️  PERMISSION/SCOPE ERROR:');
                console.log('   Need "write_campaigns" permission');
                console.log('   Check İKAS Partner Portal:');
                console.log('   → https://partner.myikas.com');
                console.log('');
            } else if (createData.errors[0].message.toLowerCase().includes('required')) {
                console.log('💡 MISSING REQUIRED FIELDS:');
                console.log('   The mutation needs additional fields');
                console.log('   Error tells us what\'s required');
                console.log('');
            }

            console.log('📋 CONCLUSION: Option B Status = UNKNOWN');
            console.log('   Need to fix permissions or required fields');
            console.log('   → Wait for İKAS support response');
            console.log('');

        } else if (createData.data && createData.data[createMutationName]) {
            const campaign = createData.data[createMutationName];

            console.log('🎉 SUCCESS! Campaign CREATED:\n');
            console.log(`✅ ID: ${campaign.id}`);
            console.log(`✅ Title: ${campaign.title}`);
            console.log(`✅ Type: ${campaign.type}`);
            console.log(`✅ Has Coupon: ${campaign.hasCoupon}`);
            if (campaign.couponPrefix) {
                console.log(`✅ Coupon Prefix: ${campaign.couponPrefix}`);
            }
            console.log('');
            console.log('🎊 OPTION B IS VIABLE!\n');
            console.log('📝 NEXT STEPS:');
            console.log('   1. Generate custom codes (UUID-based)');
            console.log('   2. Create database pool schema');
            console.log('   3. Build redemption API');
            console.log('   4. Integrate with widget');
            console.log('');
            console.log('⏱️  Estimated: 1-2 days');
            console.log('');
        } else {
            console.log('❓ UNEXPECTED RESPONSE:');
            console.log(JSON.stringify(createData, null, 2));
            console.log('');
        }

        console.log('='.repeat(60));
        console.log('');

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testCreateCampaign()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal:', err);
        process.exit(1);
    });
