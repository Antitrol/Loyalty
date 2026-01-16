import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Simple test to check if we can create campaigns
 */
export async function GET() {
    const log: string[] = [];

    try {
        log.push('🧪 Testing Option B: Create Campaign');
        log.push('');

        // Get token
        log.push('Step 1: Getting auth token...');
        const token = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!token) {
            return NextResponse.json({
                success: false,
                error: 'No auth token found',
                log
            });
        }

        results.push({ step: 'Get Token', status: 'success', data: { merchantId: token.merchantId } }); // Modified line
        log.push('');

        // Check mutations
        log.push('Step 2: Checking available mutations...');
        const introspectionResponse = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.accessToken}`
            },
            body: JSON.stringify({
                query: `
          query {
            __schema {
              mutationType {
                fields {
                  name
                }
              }
            }
          }
        `
            })
        });

        const introspectionData = await introspectionResponse.json();

        if (introspectionData.errors) {
            log.push(`❌ Error: ${introspectionData.errors[0].message}`);
            return NextResponse.json({ success: false, error: introspectionData.errors[0].message, log });
        }

        const mutations = introspectionData.data?.__schema?.mutationType?.fields || [];
        const campaignMutations = mutations
            .filter((m: any) => m.name.toLowerCase().includes('campaign'))
            .map((m: any) => m.name);

        log.push(`✅ Found ${campaignMutations.length} campaign mutations:`);
        campaignMutations.forEach((m: string) => log.push(`   - ${m}`));
        log.push('');

        const createMutation = campaignMutations.find((m: string) => m.toLowerCase().includes('create'));

        if (!createMutation) {
            log.push('❌ NO CREATE CAMPAIGN MUTATION FOUND!');
            log.push('');
            log.push('CONCLUSION: Option B is NOT viable');
            log.push('→ Must wait for İKAS support response');

            return NextResponse.json({
                success: false,
                viable: false,
                conclusion: 'No createCampaign mutation available',
                log
            });
        }

        log.push(`✅ CREATE mutation found: ${createMutation}`);
        log.push('');

        // Try to create a test campaign
        log.push('Step 3: Creating TEST campaign...');
        const testId = Math.random().toString(36).substring(2, 6);

        const createResponse = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.accessToken}`
            },
            body: JSON.stringify({
                query: `
          mutation CreateTest($input: CreateCampaignInput!) {
            ${createMutation}(input: $input) {
              id
              title
              type
              hasCoupon
            }
          }
        `,
                variables: {
                    input: {
                        title: `[TEST-AUTO] Loyalty ${testId}`,
                        type: "FIXED_AMOUNT",
                        hasCoupon: true,
                        isActive: false
                    }
                }
            })
        });

        const createData = await createResponse.json();

        if (createData.errors) {
            const errorMsg = createData.errors[0].message;
            log.push(`❌ Campaign creation failed: ${errorMsg}`);
            log.push('');

            if (errorMsg.toLowerCase().includes('permission') ||
                errorMsg.toLowerCase().includes('scope') ||
                errorMsg.toLowerCase().includes('unauthorized')) {
                log.push('⚠️  PERMISSION ERROR!');
                log.push('Need "write_campaigns" scope');
                log.push('Go to: https://partner.myikas.com');
                log.push('Add write_campaigns permission');
            } else if (errorMsg.toLowerCase().includes('required')) {
                log.push('⚠️  MISSING REQUIRED FIELDS!');
                log.push('Need to specify more campaign details');
            }

            return NextResponse.json({
                success: false,
                viable: 'unknown',
                error: errorMsg,
                log
            });
        }

        if (createData.data?.[createMutation]) {
            const campaign = createData.data[createMutation];
            log.push(`🎉 SUCCESS! Campaign created!`);
            log.push(`   ID: ${campaign.id}`);
            log.push(`   Title: ${campaign.title}`);
            log.push(`   Has Coupon: ${campaign.hasCoupon}`);
            log.push('');
            log.push('✅ OPTION B IS VIABLE!');
            log.push('');
            log.push('Next steps:');
            log.push('1. Generate custom codes');
            log.push('2. Create database pool');
            log.push('3. Build redemption API');
            log.push('4. Integrate with widget');
            log.push('');
            log.push('Estimated time: 1-2 days');

            return NextResponse.json({
                success: true,
                viable: true,
                campaign,
                log
            });
        }

        log.push('❓ Unexpected response');
        return NextResponse.json({ success: false, viable: 'unknown', log, rawResponse: createData });

    } catch (error: any) {
        log.push(`❌ Fatal error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
