// Quick check of campaign IDs in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCampaignIds() {
    try {
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        console.log("\n📊 CAMPAIGN IDs IN DATABASE:\n");
        console.log("100 points:", settings?.campaign100Id || "NOT SET");
        console.log("250 points:", settings?.campaign250Id || "NOT SET");
        console.log("500 points:", settings?.campaign500Id || "NOT SET");
        console.log("1000 points:", settings?.campaign1000Id || "NOT SET");
        console.log("\n");

        await prisma.$disconnect();
    } catch (e) {
        console.error("Error:", e.message);
        await prisma.$disconnect();
    }
}

checkCampaignIds();
