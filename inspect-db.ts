
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        const tokens = await prisma.authToken.findMany();
        console.log('✅ Tokens found:', tokens.length);

        // Check Loyalty Data
        console.log('--- Checking Loyalty Data ---');
        try {
            const transactions = await prisma.loyaltyTransaction.findMany();
            console.log('✅ Transactions found:', transactions.length);
            console.log(JSON.stringify(transactions, null, 2));

            const balances = await prisma.loyaltyBalance.findMany();
            console.log('✅ Balances found:', balances.length);
            console.log(JSON.stringify(balances, null, 2));
        } catch (err) {
            console.warn("Could not fetch loyalty data (Table might not exist yet?):", err.message);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
