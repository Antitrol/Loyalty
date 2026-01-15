import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

/**
 * Test CORRECTED listCampaign Query
 * Using proper argument syntax discovered via introspection
 * GET /api/admin/test-corrected-query?secret=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
    try {
        const secret = req.nextUrl.searchParams.get('secret');
        if (secret !== process.env.SECRET_COOKIE_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            return NextResponse.json({ error: 'No auth token' }, { status: 500 });
        }

        const ikasClient = getIkas(authToken as any);

        // Get campaign ID
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        const campaignId = settings?.campaign100Id;

        const results: any = {
            campaignId
        };

        // Test queries with CORRECT syntax (no filter wrapper)
        const testQueries = [
            {
                name: 'Query by ID with eq filter',
                query: gql`
                    query {
                        listCampaign(id: { eq: "${campaignId}" }) {
                            data {
                                id
                                title
                                hasCoupon
                                couponPrefix
                                usageCount
                                usageLimit
                            }
                        }
                    }
                `
            },
            {
                name: 'Query with hasCoupon filter',
                query: gql`
                    query {
                        listCampaign(hasCoupon: { eq: true }) {
                            data {
                                id
                                title
                                hasCoupon
                                couponPrefix
                            }
                        }
                    }
                `
            },
            {
                name: 'Query specific campaign + try to get coupons field',
                query: gql`
                    query {
                        listCampaign(id: { eq: "${campaignId}" }) {
                            data {
                                id
                                title
                                coupons {
                                    code
                                    usageCount
                                }
                            }
                        }
                    }
                `
            },
            {
                name: 'Try discountCodes field',
                query: gql`
                    query {
                        listCampaign(id: { eq: "${campaignId}" }) {
                            data {
                                id
                                title
                                discountCodes {
                                    code
                                }
                            }
                        }
                    }
                `
            }
        ];

        const queryResults = [];

        for (const test of testQueries) {
            try {
                const result = await ikasClient.query({
                    query: test.query
                });

                if (result.errors) {
                    queryResults.push({
                        name: test.name,
                        success: false,
                        error: result.errors[0].message
                    });
                } else {
                    const campaigns = result.data?.listCampaign?.data || [];

                    // Try to extract coupon codes
                    let allCodes: string[] = [];

                    campaigns.forEach((campaign: any) => {
                        if (campaign.coupons && Array.isArray(campaign.coupons)) {
                            allCodes.push(...campaign.coupons.map((c: any) => c.code || c));
                        }
                        if (campaign.discountCodes && Array.isArray(campaign.discountCodes)) {
                            allCodes.push(...campaign.discountCodes.map((c: any) => c.code || c));
                        }
                    });

                    queryResults.push({
                        name: test.name,
                        success: true,
                        campaignsFound: campaigns.length,
                        campaigns: campaigns.map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            hasCoupon: c.hasCoupon,
                            couponPrefix: c.couponPrefix
                        })),
                        codesFound: allCodes.length,
                        sampleCodes: allCodes.slice(0, 5)
                    });

                    // If we found codes, this is the winner!
                    if (allCodes.length > 0) {
                        results.SUCCESS = {
                            workingQuery: test.name,
                            totalCodes: allCodes.length,
                            allCodes
                        };
                        break; // Stop testing, we found it!
                    }
                }
            } catch (error: any) {
                queryResults.push({
                    name: test.name,
                    success: false,
                    error: error.message
                });
            }
        }

        results.queryResults = queryResults;

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
