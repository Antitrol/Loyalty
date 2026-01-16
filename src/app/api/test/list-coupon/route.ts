import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Test listCoupon query from İKAS support response
 */
export async function GET() {
    const log: string[] = [];

    try {
        log.push('🧪 Testing listCoupon Query (İKAS Support Response)');
        log.push('');

        // Get token - try from environment if database fails
        log.push('Step 1: Getting auth token...');

        let accessToken: string | null = null;

        try {
            const token = await prisma.authToken.findFirst({
                where: { deleted: false },
                orderBy: { createdAt: 'desc' }
            });

            if (token) {
                accessToken = token.accessToken;
                log.push(`✅ Token found from database`);
            }
        } catch (dbError: any) {
            log.push(`⚠️ Database unavailable (expected in local): ${dbError.message.split('\n')[0]}`);
            log.push('');
            log.push('💡 Solution: Deploy to production or provide token manually');

            return NextResponse.json({
                success: false,
                needsProduction: true,
                error: 'Database connection required for auth token',
                log,
                instructions: [
                    'Deploy to Vercel production',
                    'Or test via: https://loyalty-8isa.vercel.app/api/test/list-coupon'
                ]
            });
        }

        if (!accessToken) {
            log.push('❌ No token available');
            return NextResponse.json({ success: false, error: 'No auth token', log });
        }

        log.push('');

        // Step 2: Find GENERATE mutation exact name
        log.push('Step 2: Finding GENERATE mutation name...');

        const mutationIntrospection = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
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

        const mutationData = await mutationIntrospection.json();

        if (mutationData.errors) {
            log.push(`❌ Error: ${mutationData.errors[0].message}`);
            return NextResponse.json({ success: false, error: mutationData.errors[0].message, log });
        }

        const allMutations = mutationData.data?.__schema?.mutationType?.fields || [];
        const generateMutations = allMutations
            .filter((m: any) => m.name.toLowerCase().includes('generat') && m.name.toLowerCase().includes('coupon'))
            .map((m: any) => m.name);

        log.push(`✅ Found GENERATE mutations: ${generateMutations.join(', ') || 'NONE'}`);
        log.push('');

        // Step 3: Test listCoupon query
        log.push('Step 3: Testing listCoupon query...');

        const listCouponResponse = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                query: `
          query {
            listCoupon(pagination: { limit: 5 }) {
              data {
                id
                code
                campaignId
                isUsed
                usedAt
              }
              pageInfo {
                totalCount
                hasNextPage
              }
            }
          }
        `
            })
        });

        const couponData = await listCouponResponse.json();

        if (couponData.errors) {
            log.push(`❌ listCoupon error: ${couponData.errors[0].message}`);
            log.push('');
            log.push('Trying alternative query structure...');

            // Try simpler version
            const simpleResponse = await fetch('https://api.myikas.com/api/v1/admin/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    query: `
            query {
              listCoupon {
                id
                code
              }
            }
          `
                })
            });

            const simpleData = await simpleResponse.json();

            if (simpleData.errors) {
                log.push(`❌ Alternative also failed: ${simpleData.errors[0].message}`);

                return NextResponse.json({
                    success: false,
                    error: simpleData.errors[0].message,
                    log,
                    generateMutations
                });
            }

            log.push(`✅ Alternative query worked!`);
            log.push(`   Fetched: ${JSON.stringify(simpleData.data, null, 2)}`);

            return NextResponse.json({
                success: true,
                viable: true,
                coupons: simpleData.data.listCoupon,
                generateMutations,
                log,
                conclusion: 'listCoupon works! We CAN fetch coupon codes!'
            });
        }

        const coupons = couponData.data?.listCoupon;

        log.push(`🎉 SUCCESS! listCoupon query works!`);
        log.push(`   Total coupons: ${coupons?.pageInfo?.totalCount || coupons?.data?.length || 'unknown'}`);
        log.push(`   Sample: ${JSON.stringify(coupons?.data?.slice(0, 2) || [], null, 2)}`);
        log.push('');
        log.push('✅✅✅ SOLUTION FOUND! ✅✅✅');
        log.push('');
        log.push('We CAN retrieve coupon codes via listCoupon!');
        log.push('This means Option A is SOLVED!');
        log.push('');
        log.push('Next steps:');
        log.push('1. Use listCoupon to fetch existing codes');
        log.push('2. Store in database pool');
        log.push('3. Widget redeems from pool');

        return NextResponse.json({
            success: true,
            viable: true,
            coupons: coupons?.data || coupons,
            totalCount: coupons?.pageInfo?.totalCount,
            generateMutations,
            log,
            conclusion: 'PROBLEM SOLVED! We can fetch coupon codes via listCoupon query!'
        });

    } catch (error: any) {
        log.push(`❌ Fatal error: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
    }
}
