import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { prisma } from '@/lib/prisma';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

/**
 * DEEP Campaign Type Introspection
 * Explore ALL nested types to find where coupon codes live
 * GET /api/admin/deep-campaign-introspect?secret=YOUR_SECRET
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

        const results: any = {};

        // Deep introspection of Campaign type
        const DEEP_INTROSPECTION = gql`
            {
                __type(name: "Campaign") {
                    name
                    fields {
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
                }
            }
        `;

        const campaignResult = await ikasClient.query({
            query: DEEP_INTROSPECTION
        });

        const campaignFields = campaignResult.data?.__type?.fields || [];

        results.campaignFields = campaignFields.map((f: any) => ({
            name: f.name,
            description: f.description,
            type: f.type?.name || f.type?.ofType?.name,
            kind: f.type?.kind
        }));

        // Look for nested object types that might contain coupons
        const objectFields = campaignFields.filter((f: any) =>
            f.type?.kind === 'OBJECT' || f.type?.ofType?.kind === 'OBJECT'
        );

        results.objectTypeFields = objectFields.map((f: any) => ({
            fieldName: f.name,
            objectType: f.type?.name || f.type?.ofType?.name
        }));

        // Introspect each object type to see if they have coupon-related fields
        const nestedTypeDetails = [];

        for (const field of objectFields.slice(0, 10)) { // Limit to first 10 to avoid timeout
            const typeName = field.type?.name || field.type?.ofType?.name;

            if (!typeName) continue;

            try {
                const TYPE_INTROSPECTION = gql`
                    {
                        __type(name: "${typeName}") {
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
                            }
                        }
                    }
                `;

                const typeResult = await ikasClient.query({
                    query: TYPE_INTROSPECTION
                });

                const typeFields = typeResult.data?.__type?.fields || [];

                // Check if this type has code/coupon related fields
                const codeFields = typeFields.filter((tf: any) =>
                    tf.name.toLowerCase().includes('code') ||
                    tf.name.toLowerCase().includes('coupon')
                );

                if (codeFields.length > 0 || typeName.toLowerCase().includes('coupon')) {
                    nestedTypeDetails.push({
                        fieldName: field.name,
                        typeName,
                        hasCodeFields: codeFields.length > 0,
                        codeFields: codeFields.map((cf: any) => ({
                            name: cf.name,
                            type: cf.type?.name || cf.type?.ofType?.name
                        })),
                        allFields: typeFields.map((tf: any) => tf.name)
                    });
                }
            } catch (error: any) {
                // Skip types that fail
            }
        }

        results.potentialCouponLocations = nestedTypeDetails;

        // Also check for Connection/Edge patterns (GraphQL pagination)
        const COUPON_TYPES_SEARCH = gqlquery {
            __schema {
                types {
                    name
                        description
                        kind
                }
    }
            }
`;

        const schemaResult = await ikasClient.query({
            query: COUPON_TYPES_SEARCH
        });

        const allTypes = schemaResult.data?.__schema?.types || [];
        const couponRelatedTypes = allTypes.filter((t: any) =>
            t.name.toLowerCase().includes('coupon') ||
            t.name.toLowerCase().includes('code') ||
            t.name.toLowerCase().includes('discount')
        );

        results.couponRelatedTypesInSchema = couponRelatedTypes.map((t: any) => ({
            name: t.name,
            kind: t.kind,
            description: t.description
        }));

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
