// Production database'de müşteri bilgilerini kontrol et
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function checkCustomers() {
    console.log('🔍 Production database müşterileri kontrol ediliyor...\n');

    try {
        // Tüm müşterileri listele
        const customers = await prisma.loyaltyBalance.findMany({
            take: 10,
            orderBy: {
                points: 'desc'
            }
        });

        if (customers.length === 0) {
            console.log('❌ Henüz müşteri kaydı yok.\n');
            console.log('💡 İkas mağazanızda bir sipariş oluşturarak test müşterisi ekleyebilirsiniz.');
            return;
        }

        console.log(`✅ ${customers.length} müşteri bulundu:\n`);

        customers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.firstName} ${customer.lastName}`);
            console.log(`   Email: ${customer.email}`);
            console.log(`   Customer ID: ${customer.customerId}`);
            console.log(`   Puan: ${customer.points}`);
            console.log('');
        });

        console.log('\n💡 Widget test için bu müşteri ID\'lerinden birini kullanabilirsiniz.');
        console.log('   İkas mağazanızda bu email ile giriş yapmanız yeterli.');

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCustomers();
