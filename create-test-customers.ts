import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestCustomers() {
    console.log('Creating test customers...');

    // Create test customers
    const customers = [
        {
            customerId: 'test-customer-1',
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet@test.com',
            points: 500
        },
        {
            customerId: 'test-customer-2',
            firstName: 'Ayşe',
            lastName: 'Demir',
            email: 'ayse@test.com',
            points: 1200
        },
        {
            customerId: 'test-customer-3',
            firstName: 'Mehmet',
            lastName: 'Kaya',
            email: 'mehmet@test.com',
            points: 2500
        }
    ];

    for (const customer of customers) {
        await prisma.loyaltyBalance.upsert({
            where: { customerId: customer.customerId },
            update: customer,
            create: customer
        });
        console.log(`✅ Created: ${customer.firstName} ${customer.lastName} (${customer.points} points)`);
    }

    console.log('\n✅ Test customers created successfully!');
    await prisma.$disconnect();
}

createTestCustomers()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
