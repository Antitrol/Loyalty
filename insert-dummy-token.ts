
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB to insert dummy token...');
    try {
        const dummyId = "dummy-app-id-" + Date.now();

        // We need a customer ID to make the test work, but this token is for the STORE.
        // The webhook test needs a valid signature, which requires a valid token in the DB.

        const token = await prisma.authToken.create({
            data: {
                id: dummyId,
                authorizedAppId: dummyId,
                merchantId: "dummy-merchant-id",
                accessToken: "dummy-access-token",
                refreshToken: "dummy-refresh-token",
                tokenType: "Bearer",
                expiresIn: 3600,
                expireDate: new Date(Date.now() + 3600000),
                deleted: false
            }
        });

        console.log('Dummy Token Inserted:', token);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
