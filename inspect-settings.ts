
import { prisma } from './src/lib/prisma';

async function main() {
    console.log("🔍 Inspecting LoyaltySettings...");

    try {
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (settings) {
            console.log("✅ Settings found:", JSON.stringify(settings, null, 2));
        } else {
            console.log("❌ No settings found with id='default'");
        }

        // List all
        const all = await prisma.loyaltySettings.findMany();
        console.log("All settings count:", all.length);

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
