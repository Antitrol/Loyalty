
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const tokens = await prisma.authToken.findMany();
        console.log(`Found ${tokens.length} tokens.`);
        if (tokens.length > 0) {
            console.log('Token Sample:', tokens[0].merchantId);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
