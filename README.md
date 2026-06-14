# 🛡️ Aegis (OmniAgent) - Otonom Kişisel Yapay Zeka Asistanı

Aegis (eski adıyla EmailAgent), Semantic Kernel üzerine inşa edilmiş, çoklu LLM (Büyük Dil Modeli) destekli, tam otonom ve modüler bir kişisel yapay zeka asistanıdır. Yalnızca soruları yanıtlamakla kalmaz; sizin adınıza kararlar alır, internette derinlemesine araştırma yapar, alışveriş ürünlerini takip edip fırsatları yakalar, e-postalarınızı analiz eder ve günlük yaşantınızı Telegram veya Web arayüzü üzerinden yönetir.

## 🌟 Öne Çıkan Özellikler

### 🧠 Çoklu LLM ve Dinamik Zeka (Multi-LLM Architecture)
Sistem tek bir yapay zeka modeline bağımlı değildir. Kullanıcılar `UserPreferences` üzerinden diledikleri sağlayıcıyı seçebilirler:
- **Gemini (Google):** Varsayılan sağlayıcı (gemini-flash-latest). Hızlı, esnek ve çok modlu (multimodal) analizlerde başarılı.
- **Claude (Anthropic):** Karmaşık akıl yürütme, kodlama ve yapılandırılmış metin işleme (claude-3-5-sonnet-latest).
- **OpenAI:** GPT-4o-mini entegrasyonu.
- **Groq:** LLaMA 3.3 70B modeli ile ultra düşük gecikmeli, anlık çıkarım yeteneği.
- **OpenRouter:** Diğer yüzlerce açık kaynaklı modele anında erişim.

AegisKernelBuilder üzerinden dinamik olarak ayağa kalkan bu yapı, Semantic Kernel yeteneklerini her modele entegre eder.

### 🕷️ Evrensel Otonom Web Kazıyıcı (Universal Scraper & AI Discovery)
Geleneksel web scraping yöntemleri, sitelerin tasarım değiştirmesiyle kolayca bozulur. Aegis bu sorunu **AI Discovery** (Yapay Zeka Tabanlı Keşif) ile çözer:
1. **Dinamik Keşif:** Bilinmeyen bir domain'e girildiğinde `SiteDiscoveryPlugin` devreye girer.
2. **AI Analizi:** Sayfanın küçültülmüş (minified) HTML yapısı yapay zekaya gönderilir. AI; başlık, fiyat, stok durumu ve *gerçek ürün görseli* (site logoları dışlanarak) için en doğru CSS seçicilerini (selectors) bulur.
3. **Akıllı Önbellekleme:** Keşfedilen strateji PostgreSQL veritabanındaki `SiteStrategyDefinitions` tablosuna kaydedilir.
4. **Hızlı Çalıştırma:** Sonraki denemelerde `DynamicDatabaseStrategy` doğrudan bu CSS seçicilerini kullanarak Playwright üzerinden saniyeler içinde veriyi çeker. Tekrar tekrar AI maliyeti yaratmaz.

### 🛒 Akıllı Alışveriş ve Fırsat Avcısı (Shopping Tracker)
Aegis sizin yerinize piyasayı izler. Hangfire arka plan görevleriyle çalışan yapı:
- **Ürün Takibi:** İstediğiniz ürünün linkini verdiğinizde, belirlediğiniz hedef fiyata düşene kadar izler. 
- **Kategori Takibi:** Belirli bir kategori sayfasındaki ("RTX 4090 Ekran Kartları") tüm ilanları tarar. Yeni bir ilan açıldığında veya mevcut bir ilanın fiyatında belirlediğiniz "Minimum İndirim Yüzdesi" kadar bir düşüş olduğunda sizi uyarır.
- **Görsel Algılama:** Sadece metin değil, `ImageUrl` üzerinden fırsatın kapak fotoğrafını da kullanıcı paneline taşır.

### ✉️ E-posta & İletişim Asistanı
- **Gmail Entegrasyonu:** Gelen kutunuzu analiz eder, spam/önemli ayrımı yapar.
- **Otomatik Taslaklar:** Gelen maillere sizin dilinizden (belirlediğiniz Persona'ya göre) taslak yanıtlar hazırlar.
- **Özetleme:** Uzun bültenleri veya iş maillerini saniyeler içinde özetler.

### 💬 Omnichannel Etkileşim (Telegram & Web)
Aegis sadece bir web paneline hapsolmamıştır.
- **Telegram Bot:** Benzersiz "Pairing Code" (Eşleştirme Kodu) ile Telegram'dan bağlanırsınız. Doğal dilde komutlar vererek ürün ekleyebilir, hatırlatıcı kurabilir veya soru sorabilirsiniz.
- **Sesli Komut:** Telegram'dan gönderdiğiniz ses kayıtları **Groq Whisper** altyapısıyla (ISpeechToTextService) anında metne çevrilir ve işlenir.
- **Belge Analizi:** Telegram üzerinden PDF gönderdiğinizde indirir, okur ve belge üzerinden size bilgi verir.
- **Canlı Dashboard:** React + Vite ile yazılmış, siberpunk esintili, canlı "Live Ticker", veri akışı ve "Finalist Deals" bölümleri sunan modern web paneli.

### 📅 Takvim, Hatırlatıcı ve Ötesi
- **Takvim:** Google Calendar entegrasyonu sayesinde toplantılarınızı okur ve yeni etkinlikler oluşturabilir.
- **Hatırlatıcı:** Belirlediğiniz zamana doğal dilde (Örn: "Yarın sabah 9'da bana su içmeyi hatırlat") alarm kurar.

---

## 🏗️ Sistem Mimarisi

Aegis, Clean Architecture (Temiz Mimari) prensipleriyle tasarlanmış, modüler bir .NET 10 Web API uygulamasıdır.

```text
EmailAgent (Aegis)
├── EmailAgent.Core             # Varlıklar (Entities), Arayüzler (Interfaces)
├── EmailAgent.Infrastructure   # PostgreSQL, Entity Framework, Playwright, Hangfire Jobs
├── EmailAgent.Agent            # Semantic Kernel Bağlantıları, Pluginler, AI Agent (UniversalScraperAgent)
├── EmailAgent.API              # ASP.NET Core API, Controllerlar, Bot Hosted Service
└── EmailAgent.Web              # React.js (TypeScript) Frontend UI
```

### 🧩 Plugin Mimarisi (Semantic Kernel)
Uygulamanın eylem kabiliyetleri Semantic Kernel Plugin'leri olarak tasarlanmıştır. Bu sayede yapay zeka bir soruyu yanıtlarken hangi aracı (tool) kullanacağına otomatik karar verir.

- `SiteDiscoveryPlugin`: Bilinmeyen sitelerin anatomisini çözer.
- `DeepWebScraperPlugin`: Veritabanında kayıtlı stratejiler ile URL'leri anlık kazır.
- `ShoppingPlugin`: Spesifik ürünleri takip listesine ekler.
- `CategoryTrackingPlugin`: Kategori sayfalarını tarayıp deltaları (fiyat düşüşlerini) bulur.
- `NotificationPlugin`: Telegram veya WhatsApp üzerinden kullanıcıya anlık bildirim atar.
- `DocumentPlugin`: Belge ve dosyaları analiz eder.
- `WebSearchPlugin`: İnternette arama yapıp sentezler.

### 🗄️ Veritabanı ve Arka Plan (PostgreSQL & Hangfire)
- EF Core kullanılarak yapılandırılmış güçlü PostgreSQL tabloları. 
- JSON nesnelerinden (AI Discovery), kullanıcı tercihlerine (`UserPreferences`), otonom geçmişe (`NotificationLogs`, `PriceHistory`) kadar her şey burada saklanır.
- **Hangfire**, asenkron kuyruk yapısıyla gece gündüz uyumadan scraper (kazıyıcı) işlerini, hatırlatıcıları ve veri mutabakatını arka planda (Background Service) yürütür.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler
- .NET 10 SDK
- Node.js (Frontend için)
- PostgreSQL Veritabanı
- Playwright tarayıcı binary'leri

### 1. Veritabanı Ayarları
`EmailAgent.API` klasörü altındaki `appsettings.json` dosyasına PostgreSQL bilgilerinizi girin.
*(Not: Uygulama ilk kez ayağa kalktığında Program.cs içerisindeki script eksik tabloları ve kolonları otomatik olarak `IF NOT EXISTS` ile oluşturur, manuel Entity Framework migration'a mecbur bırakmaz.)*

### 2. Playwright Kurulumu
Uygulama çalışmadan önce scraper'ın Chromium/Firefox gibi motorları kurması gerekir:
```bash
pwsh bin/Debug/net10.0/playwright.ps1 install
```

### 3. Backend'i Başlatma
```bash
cd EmailAgent.API
dotnet run
```
API `http://localhost:5209` adresinde çalışmaya başlayacak ve Swagger arayüzüne yönlendirecektir. Telegram Bot Hosted Service de bu aşamada arka planda ayağa kalkar (Geçerli bir bot token girildiyse).

### 4. Frontend'i Başlatma
```bash
cd EmailAgent.Web
npm install
npm run dev
```
Web Dashboard `http://localhost:5173` adresinde yayına girecektir.

---

## 🔐 Güvenlik ve Kararlılık
- **Circuit Breaker:** Scraper servisi sürekli HTTP 403 veya 429 alırsa siteyi bir süreliğine karantinaya alır.
- **Concurrency Control:** `SemaphoreSlim` yapısı kullanılarak aynı domaine aynı anda yüzlerce istek atılması engellenir, anti-bot sistemlerine yakalanma riski düşürülür.
- **Fault Tolerance:** Telegram API gibi dış bağımlılıklar zaman aşımına uğrarsa `TelegramBotHostedService` uygulamayı çökertmez; hataları absorbe ederek bağlantı gelene kadar hayatta kalır.
- **IP Kısıtlaması:** Canlı log akışı (SignalR /loghub) yalnızca yerel ağdan izlenebilecek şekilde güvenlik altına alınmıştır.

---

Aegis, tamamen sizin kişisel ihtiyaçlarınıza adapte olan, her geçen gün yeni bir e-ticaret sitesini otomatik öğrenen ve yaşantınızı kolaylaştıran modern bir AI asistan deneyimidir.
