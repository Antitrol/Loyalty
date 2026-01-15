import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

/**
 * Introspect listCampaign Query Structure
 * GET /api/admin/introspect-list-campaign?secret=YOUR_SECRET
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

        // Introspect Query type to see listCampaign definition
        const QUERY_INTROSPECTION = gql`
            {
                __schema {
                    queryType {
                        fields {
                            name
                            description
                            args {
                                name
                                description
                                type {
                                    name
                                    kind
                                    ofType {
                                        name
                                        kind
                                    }
                                }
                            }
                            type {
                                name
                                kind
                                ofType {
                                    name
                                    kind
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await ikasClient.query({
            query: QUERY_INTROSPECTION
        });

        const queryFields = result.data?.__schema?.queryType?.fields || [];

        // Find listCampaign and campaign queries  
        const campaignQueries = queryFields.filter((f: any) =>
            f.name.toLowerCase().includes('campaign')
        );

        // Get detailed info about listCampaign
        const listCampaignField = queryFields.find((f: any) => f.name === 'listCampaign');

        return NextResponse.json({
            success: true,
            listCampaignDetails: {
                name: listCampaignField?.name,
                description: listCampaignField?.description,
                arguments: listCampaignField?.args?.map((arg: any) => ({
                    name: arg.name,
                    description: arg.description,
                    type: arg.type?.name || arg.type?.ofType?.name,
                    kind: arg.type?.kind,
                    required: arg.type?.kind === 'NON_NULL'
                })),
                returnType: listCampaignField?.type?.name || listCampaignField?.type?.ofType?.name
            },
            allCampaignQueries: campaignQueries.map((f: any) => ({
                name: f.name,
                description: f.description,
                args: f.args?.map((a: any) => `${a.name}: ${a.type?.name || a.type?.ofType?.name}`)
            }))
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
