import { prisma } from './src/lib/prisma';

async function addTestPoints() {
    try {
        const customerId = 'b7ed7574-a51e-47a7-b0d4-d39f10fb2455'; // Test customer ID

        // Check if customer exists
        let customer = await prisma.loyaltyBalance.findUnique({
            where: { customerId }
        });

        console.log('Current balance:', customer);

        if (!customer) {
            // Create customer with initial points
            customer = await prisma.loyaltyBalance.create({
                data: {
                    customerId,
                    points: 2000,
                    lifetimePoints: 2000
                }
            });
            console.log('Created new customer with 2000 points');
        } else {
            // Update existing customer
            customer = await prisma.loyaltyBalance.update({
                where: { customerId },
                data: {
                    points: 2000,
                    lifetimePoints: 2000
                }
            });
            console.log('Updated customer to 2000 points');
        }

        console.log('Final balance:', customer);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addTestPoints();
