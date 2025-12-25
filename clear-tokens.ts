
import { prisma } from './src/lib/prisma';

async function main() {
    console.log('Deleting all AuthTokens...');
    const result = await prisma.authToken.deleteMany({});
    console.log(`Deleted ${result.count} tokens.`);

    // Also clear transactions/balances for a clean start
    await prisma.loyaltyTransaction.deleteMany({});
    await prisma.loyaltyBalance.deleteMany({});
    console.log('Cleared transactions and balances.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
