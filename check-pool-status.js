const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPool() {
    try {
        console.log('=== COUPON POOL STATUS ===\n');

        const stats = await prisma.couponPool.groupBy({
            by: ['tier'],
            _count: { _all: true },
            where: { usedAt: null }
        });

        console.log('Available Coupons by Tier:');
        stats.forEach(s => {
            console.log(`  ${s.tier} points: ${s._count._all} coupons`);
        });

        const used = await prisma.couponPool.count({
            where: { usedAt: { not: null } }
        });
        console.log(`\nUsed Coupons: ${used}`);

        const total = await prisma.couponPool.count();
        console.log(`Total Coupons in Database: ${total}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkPool();
