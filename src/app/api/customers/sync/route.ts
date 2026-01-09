import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIkas } from '@/helpers/api-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { GET_CUSTOMERS } from '@/lib/graphql/loyalty';

export const dynamic = 'force-dynamic';

/**
 * Sync customers from İkas to LoyaltyBalance
 * Fetches all customers from İkas GraphQL API and adds them to local database
 */
export async function POST(req: NextRequest) {
    try {
        // Get auth token
        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No auth token found'
            }, { status: 401 });
        }

        const token = tokens[0];
        const client = getIkas(token);

        // Fetch customers from İkas
        const query = GET_CUSTOMERS;
        const response = await client.query<{ customers: any }>({ query });

        if (!response.data?.customers?.edges) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch customers from İkas'
            }, { status: 500 });
        }

        const ikasCustomers = response.data.customers.edges.map((edge: any) => edge.node);

        let syncedCount = 0;
        let existingCount = 0;
        let errorCount = 0;

        // Process each customer
        for (const ikasCustomer of ikasCustomers) {
            try {
                const customerId = ikasCustomer.id;

                // Check if customer already exists
                const existing = await prisma.loyaltyBalance.findUnique({
                    where: { customerId }
                });

                if (existing) {
                    existingCount++;
                    // Update customer info if changed
                    await prisma.loyaltyBalance.update({
                        where: { customerId },
                        data: {
                            firstName: ikasCustomer.firstName || existing.firstName,
                            lastName: ikasCustomer.lastName || existing.lastName,
                            email: ikasCustomer.email || existing.email
                        }
                    });
                } else {
                    // Create new customer with 0 points
                    await prisma.loyaltyBalance.create({
                        data: {
                            customerId,
                            firstName: ikasCustomer.firstName,
                            lastName: ikasCustomer.lastName,
                            email: ikasCustomer.email,
                            points: 0
                        }
                    });
                    syncedCount++;
                }
            } catch (err) {
                console.error(`Error processing customer ${ikasCustomer.id}:`, err);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            synced: syncedCount,
            existing: existingCount,
            total: ikasCustomers.length,
            errors: errorCount,
            message: `${syncedCount} yeni müşteri eklendi, ${existingCount} mevcut müşteri güncellendi`
        });

    } catch (error) {
        console.error('Sync customers error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
