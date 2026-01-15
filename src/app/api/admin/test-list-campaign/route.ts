import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

/**
 * Test listCampaign Query for Coupon Fetch
 * GET /api/admin/test-list-campaign?secret=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
    try {
        const secret = req.nextUrl.searchParams.get('secret');
        if (secret !== process.env.SECRET_COOKIE_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results: any = {};

        // Get auth token
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

        if (!campaignId) {
            return NextResponse.json({ error: 'No campaign ID configured' });
        }

        results.campaignId = campaignId;

        // Test listCampaign with various approaches
        const testQueries = [
            {
                name: 'listCampaign with ID filter + coupons field',
                query: gql`
                    query {
                        listCampaign(filter: { id: "${campaignId}" }) {
                            data {
                                id
                                title
                                hasCoupon
                                coupons {
                                    code
                                }
                            }
                        }
                    }
                `
            },
            {
                name: 'listCampaign with ID filter + codes field',
                query: gql`
                    query {
                        listCampaign(filter: { id: "${campaignId}" }) {
                            data {
                                id
                                title
                                hasCoupon
                                codes {
                                    code
                                    usageCount
                                }
                            }
                        }
                    }
                `
            },
            {
                name: 'listCampaign with hasCoupon filter',
                query: gql`
                    query {
                        listCampaign(filter: { hasCoupon: true }) {
                            data {
                                id
                                title
                                couponPrefix
                                coupons {
                                    code
                                }
                            }
                        }
                    }
                `
            },
            {
                name: 'listCampaign basic fields only',
                query: gql`
                    query {
                        listCampaign(filter: { id: "${campaignId}" }) {
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
                    const campaign = result.data?.listCampaign?.data?.[0];

                    // Try to extract codes
                    let codes: string[] = [];

                    if (campaign?.coupons) {
                        if (Array.isArray(campaign.coupons)) {
                            codes = campaign.coupons.map((c: any) => c.code || c);
                        }
                    }

                    if (campaign?.codes) {
                        if (Array.isArray(campaign.codes)) {
                            codes = campaign.codes.map((c: any) => c.code || c);
                        }
                    }

                    queryResults.push({
                        name: test.name,
                        success: true,
                        campaign: {
                            id: campaign?.id,
                            title: campaign?.title,
                            hasCoupon: campaign?.hasCoupon,
                            couponPrefix: campaign?.couponPrefix
                        },
                        codesFound: codes.length,
                        sampleCodes: codes.slice(0, 5),
                        fullData: campaign
                    });

                    // If we found codes, mark it
                    if (codes.length > 0) {
                        results.workingQuery = test.name;
                        results.allCodes = codes;
                        break;
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
