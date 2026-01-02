# Loyalty Uygulaması - Veri Gizliliği ve İşleme Politikası

**Versiyon:** 1.0  
**Son Güncelleme:** 2 Ocak 2026  
**Geçerli Yasalar:** GDPR (AB), KVKK (Türkiye)

---

## 📊 Genel Bakış

Bu belge, Loyalty Uygulaması'nın ("Uygulama") İkas e-ticaret mağazalarıyla entegre olduğunda müşteri verilerini nasıl topladığını, işlediğini, sakladığını ve koruduğunu açıklar.

---

## 🔍 Hangi Müşteri Verilerini Topluyoruz

### İkas Platformunda Saklanan Veriler (Customer Tags)

Sadakat bilgilerini saklamak için İkas'ın yerel etiketleme sistemini kullanıyoruz:

| Etiket | Amacı | Örnek |
|--------|-------|-------|
| `Loyalty:Points:XXX` | Güncel puan bakiyesi | `Loyalty:Points:150` |
| `Loyalty:Tier:XXX` | Müşteri tier seviyesi | `Loyalty:Tier:Gold` |
| `Loyalty:Lifetime:XXX` | Toplam kazanılan puan | `Loyalty:Lifetime:800` |

**Neden Etiket Sistemi?**
- ✅ İkas'ın yerel özelliği
- ✅ Mağaza sahipleri tarafından görülebilir
- ✅ Kolayca geri alınabilir
- ✅ Özel şema gerektirmez

### Kendi Veritabanımızda Saklanan Veriler

Performans ve güvenilirlik için kendi veritabanımızı tutuyoruz:

| Veri Tipi | Amacı | Saklama Süresi |
|-----------|-------|----------------|
| Müşteri ID | İkas müşterisine bağlantı | Kalıcı (silinene kadar) |
| Ad, Soyad | Görüntüleme amaçlı | İkas'tan senkronize |
| E-posta Adresi | Bildirimler (opsiyonel) | İkas'tan senkronize |
| Puan Bakiyesi | İkas etiketlerinin yedeği | Gerçek zamanlı senkron |
| İşlem Geçmişi | Denetim kaydı | 2 yıl |
| Zaman Damgaları | Uyumluluk takibi | Kalıcı |

---

## ❌ Toplamadığımız Veriler

Açıkça **TOPLAMIYORUZ**, saklamıyoruz veya işlemiyoruz:

- ❌ Kredi kartı veya ödeme bilgileri
- ❌ Şifreler veya kimlik doğrulama bilgileri
- ❌ Tam adresler (sadece görüntüleme için şehir/ülke okuyabiliriz)
- ❌ Telefon numaraları
- ❌ Doğum tarihi
- ❌ Devlet tarafından verilen kimlik numaraları
- ❌ GDPR Madde 9'a göre hassas kişisel veriler

---

## 🎯 Veriyi Nasıl Kullanıyoruz

### Birincil Kullanımlar

1. **Puan Hesaplama**
   - Satın alma tutarlarına göre sadakat puanı hesaplama
   - Kategori bonusları ve tier çarpanları uygulama
   - Puan kullanımlarını işleme

2. **Tier Yönetimi**
   - Toplam puana göre müşteri tier'ını belirleme
   - Tier'a özel avantajları uygulama

3. **İşlem Kayıtları**
   - Tüm puan işlemlerinin denetim kaydını tutma
   - Anlaşmazlık çözümünü sağlama
   - Mağaza raporlaması sağlama

4. **Dashboard Analytics**
   - Mağaza sahiplerine toplu istatistikler gösterme
   - Müşteri sadakat profillerini gösterme
   - Rapor oluşturma

### Veriyi KULLANMADIĞIMIZ Alanlar

- ❌ Müşterilere pazarlama (e-posta yok, reklam yok)
- ❌ Üçüncü taraflara satış
- ❌ Sadakat tier'ı dışında profilleme
- ❌ Satın almalar dışında davranış takibi
- ❌ Mağazalar arası veri paylaşımı

---

## 🔐 Veri Güvenliği

### Teknik Önlemler

- 🔒 **Transfer Sırasında Şifreleme:** Tüm veri HTTPS/TLS ile iletilir
- 🔒 **Veritabanı Güvenliği:** SQLite kısıtlı erişimle (dev), PostgreSQL şifrelemeli (prod)
- 🔒 **Kimlik Doğrulama:** İkas API erişimi için OAuth 2.0
- 🔒 **Webhook Doğrulama:** HMAC-SHA256 imza doğrulaması
- 🔒 **Loglarda Kişisel Veri Yok:** Kişisel veriler asla console veya dosyalara yazılmaz

### Organizasyonel Önlemler

- 👥 Müşteri verisine erişim sadece yetkili personelle sınırlı
- 📝 Düzenli güvenlik denetlemeleri
- 🔄 Şifrelemeli otomatik yedeklemeler
- 🚨 Olay müdahale planı mevcut

---

## ⏰ Veri Saklama Süreleri

### Aktif Müşteriler

- Müşteri verisi, İkas mağazasında aktif olduğu sürece saklanır
- İşlem geçmişi **24 ay** süreyle saklanır (yasal gereklilik)

### Silinen Müşteriler

Bir müşteri İkas'tan silindiğinde:

1. **Anında:** Puan etiketleri İkas'tan kaldırılır
2. **30 Gün:** Veritabanımızda geçici silme
3. **30 Gün Sonra:** Veritabanımızdan kalıcı silme

### Mağaza Başlatımlı Silme

Mağazalar herhangi bir müşteri için anında veri silme talep edebilir:
- Doğrudan veritabanı temizliği (araçlar sağlıyoruz)
- Destek talebi (7 iş günü içinde işlenir)

---

## 👤 Veri Sahibinin Hakları (GDPR/KVKK)

Müşterilerin aşağıdaki hakları vardır:

### 1. Erişim Hakkı
Müşteriler hakkında tuttuğumuz tüm veriyi görebilirler.
- **Yanıt Süresi:** 30 gün
- **Format:** JSON export veya okunabilir rapor

### 2. Düzeltme Hakkı
Müşteriler yanlış verilerin düzeltilmesini talep edebilir.
- **Süreç:** Mağaza düzeltme gönderir → 7 gün içinde güncelliyoruz

### 3. Silme Hakkı ("Unutulma Hakkı")
Müşteriler tam silme talep edebilir.
- **Süreç:** Yukarıdaki "Silinen Müşteriler" bölümüne bakın
- **İstisnalar:** İşlem geçmişi yasal uyumluluk için saklanabilir (24 aya kadar)

### 4. Taşınabilirlik Hakkı
Müşteriler verilerini makine okunabilir formatta talep edebilir.
- **Format:** JSON export

### 5. İtiraz Hakkı
Müşteriler veri işlemeye itiraz edebilir.
- **Sonuç:** O müşteri için puan programı devre dışı bırakılır

---

## 📧 Hakların Kullanılması

**Son Müşteriler İçin:**
1. Alışveriş yaptığınız mağaza (satıcı) ile iletişime geçin
2. Mağaza talebi bize iletir
3. Yasal sürelerde işler yapıyoruz

**Mağazalar İçin:**
- E-posta: [DESTEK-EPOSTANız]
- Yanıt Süresi: 7 iş günü

---

## 🌍 Uluslararası Veri Transferleri

- **Birincil Depolama:** [Sunucu konumunuz, örn: "AB (Frankfurt, Almanya)"]
- **Yedek Depolama:** [Varsa]
- **Üçüncü Taraf Hizmetler:** Sadece İkas resmi API'lerini kullanıyoruz (veri İkas altyapısında kalır)

Uygun önlemler olmadan müşteri verisi AB/Türkiye dışına transfer edilmez.

---

## 🔔 Politika Değişiklikleri

Bu politikayı zaman zaman güncelleyebiliriz. Güncellediğimizde:

1. Versiyon numarası artırılır
2. "Son Güncelleme" tarihi değiştirilir
3. Mağazalar e-posta ile bilgilendirilir
4. Müşteriler mağaza tarafından bilgilendirilebilir (önerilir)

---

## 📞 İletişim ve Veri Koruma Sorumlusu

**Gizlilik Soruları İçin:**
- E-posta: [VERİ-KORUMA-EPOSTANız]
- Yanıt Süresi: 7 iş günü

**Veri İhlalleri İçin:**
- Acil Durum: [ACİL-İLETİŞİM]
- İlgili tarafları ihlal keşfinden **72 saat** içinde bilgilendiririz (GDPR gereksinimi)

---

## ✅ Uyumluluk Kontrol Listesi

- [x] GDPR Madde 5 (Hukuka uygunluk, adillik, şeffaflık)
- [x] GDPR Madde 6 (Yasal dayanak: Sözleşme yerine getirme)
- [x] GDPR Madde 15-22 (Veri sahibinin hakları)
- [x] GDPR Madde 32 (Güvenlik önlemleri)
- [x] GDPR Madde 33 (İhlal bildirimi)
- [x] KVKK Madde 4 (Veri işleme ilkeleri)
- [x] KVKK Madde 11 (Veri sahibinin hakları)

---

## 📝 İşleme için Yasal Dayanak

GDPR Madde 6 ve KVKK Madde 5 uyarınca işleme için yasal dayanağımız:

1. **Sözleşme İfa (Mad. 6.1.b):** Sadakat hizmetleri sağlamak için gerekli işleme
2. **Meşru Menfaat (Mad. 6.1.f):** Dolandırıcılık önleme, güvenlik, analitik

---

**Belge Versiyonu:** 1.0  
**Yürürlük Tarihi:** 2 Ocak 2026  
**Gözden Geçirme Döngüsü:** Yıllık
