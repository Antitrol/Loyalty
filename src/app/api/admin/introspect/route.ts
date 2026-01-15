import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

/**
 * İKAS API Introspection Endpoint
 * GET /api/admin/introspect?secret=YOUR_SECRET
 * 
 * Discovers İKAS Campaign schema and tests coupon fetching
 */
export async function GET(req: NextRequest) {
    try {
        // Security check
        const secret = req.nextUrl.searchParams.get('secret');
        if (secret !== process.env.SECRET_COOKIE_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results: any = {
            step1: null,
            step2: null,
            step3: null
        };

        // Get auth token
        const authToken = await prisma.authToken.findFirst({
            where: { deleted: false },
            orderBy: { createdAt: 'desc' }
        });

        if (!authToken) {
            return NextResponse.json({ error: 'No auth token found' }, { status: 500 });
        }

        const ikasClient = getIkas(authToken as any);

        // Step 1: Inspect Campaign type
        const CAMPAIGN_TYPE = gql`
            {
                __type(name: "Campaign") {
                    name
                    fields {
                        name
                        type {
                            name
                            kind
                            ofType {
                                name
                            }
                        }
                        args {
                            name
                            type {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            const typeResult = await ikasClient.query({
                query: CAMPAIGN_TYPE
            });

            const fields = typeResult.data?.__type?.fields || [];

            results.step1 = {
                success: true,
                fields: fields.map((f: any) => ({
                    name: f.name,
                    type: f.type?.name || f.type?.ofType?.name,
                    kind: f.type?.kind,
                    isCouponField: f.name.toLowerCase().includes('coupon') || f.name.toLowerCase().includes('code'),
                    args: f.args?.map((a: any) => ({ name: a.name, type: a.type.name }))
                }))
            };
        } catch (error: any) {
            results.step1 = { success: false, error: error.message };
        }

        // Step 2: Get a campaign ID
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        const campaignId = settings?.campaign100Id;

        if (!campaignId) {
            return NextResponse.json({
                ...results,
                error: 'No campaign ID configured'
            });
        }

        // Step 3: Try multiple query structures
        const testQueries = [
            {
                name: 'edges/nodes structure',
                query: gql`
                    query($id: ID!) {
                        campaign(id: $id) {
                            id
                            title
                            configuration {
                                ... on DiscountCodeConfiguration {
                                    codes(first: 5) {
                                        edges {
                                            node {
                                                code
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `
            },
            {
                name: 'simple codes array',
                query: gql`
                    query($id: ID!) {
                        campaign(id: $id) {
                            id
                            title
                            codes {
                                code
                            }
                        }
                    }
                `
            },
            {
                name: 'coupons field',
                query: gql`
                    query($id: ID!) {
                        campaign(id: $id) {
                            id
                            title
                            coupons {
                                code
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
                    query: test.query,
                    variables: { id: campaignId }
                });

                if (result.errors) {
                    queryResults.push({
                        name: test.name,
                        success: false,
                        error: result.errors[0].message
                    });
                } else {
                    // Extract codes
                    const data = result.data;
                    let codes: string[] = [];

                    if (data?.campaign?.configuration?.codes?.edges) {
                        codes = data.campaign.configuration.codes.edges.map((e: any) => e.node.code);
                    } else if (data?.campaign?.codes) {
                        codes = Array.isArray(data.campaign.codes) ? data.campaign.codes.map((c: any) => c.code) : [];
                    } else if (data?.campaign?.coupons) {
                        codes = Array.isArray(data.campaign.coupons) ? data.campaign.coupons.map((c: any) => c.code) : [];
                    }

                    queryResults.push({
                        name: test.name,
                        success: true,
                        codesFound: codes.length,
                        sampleCodes: codes.slice(0, 3),
                        fullResponse: data
                    });

                    // If we found codes, stop
                    if (codes.length > 0) {
                        results.step3 = {
                            workingQuery: test.name,
                            codes
                        };
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

        results.step2 = { campaignId };
        results.step3 = { queryResults };

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
