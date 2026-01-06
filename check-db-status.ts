import { prisma } from './src/lib/prisma';

async function checkDatabase() {
    try {
        console.log('🔍 Veritabanı Durumu Kontrol Ediliyor...\n');

        // AuthToken kontrolü
        const authTokens = await prisma.authToken.findMany();
        console.log('📝 AuthToken Kayıtları:', authTokens.length);
        if (authTokens.length > 0) {
            authTokens.forEach((token, i) => {
                console.log(`\n  Token ${i + 1}:`);
                console.log(`    Merchant ID: ${token.merchantId}`);
                console.log(`    App ID: ${token.authorizedAppId}`);
                console.log(`    Expire Date: ${token.expireDate}`);
                console.log(`    Is Expired: ${new Date() > token.expireDate}`);
            });
        }

        // Settings kontrolü
        console.log('\n⚙️ Settings Kontrolü:');
        const settings = await prisma.loyaltySettings.findUnique({
            where: { id: 'default' }
        });

        if (settings) {
            console.log('  ✅ Settings mevcut');
            console.log(`  widgetTheme: ${(settings as any).widgetTheme || 'YOK'}`);
            console.log(`  widgetStyle: ${(settings as any).widgetStyle || 'YOK'}`);
            console.log(`  widgetPrimaryColor: ${settings.widgetPrimaryColor}`);
        } else {
            console.log('  ❌ Settings bulunamadı');
        }

        // Müşteri sayısı
        const customerCount = await prisma.loyaltyBalance.count();
        console.log(`\n👥 Müşteri Sayısı: ${customerCount}`);

        console.log('\n✅ Kontrol tamamlandı!');

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
