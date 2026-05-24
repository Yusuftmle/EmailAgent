# EmailAgent - WhatsApp AI Email Assistant 🤖📧

EmailAgent, WhatsApp üzerinden sizinle doğal dilde konuşarak e-postalarınızı yönetebilen akıllı bir yapay zeka asistanıdır. Microsoft **Semantic Kernel**, **Google Gemini API**, ve **.NET 10** kullanılarak geliştirilmiştir. 

Sadece bir WhatsApp mesajı atarak asistanınızdan toplantı notlarınızı birilerine mail atmasını isteyebilir, veya son gelen maillerinizin özetini çıkartmasını sağlayabilirsiniz!

## 🚀 Özellikler

- **WhatsApp Entegrasyonu:** Twilio API kullanılarak tam teşekküllü WhatsApp Chatbot deneyimi.
- **Yapay Zeka (LLM):** Google Gemini (`gemini-flash-latest`) ve Microsoft Semantic Kernel entegrasyonu.
- **LLM Tool Calling (Fonksiyon Çağırma):** Yapay zekanın sadece metin üretmekle kalmayıp, kendi kararıyla kodunuzdaki fonksiyonları (E-posta göndermek, Gelen kutusunu okumak vs.) çalıştırabilmesi.
- **Gmail API:** Google OAuth2 ile güvenli bir şekilde e-posta okuma ve gönderme yeteneği.
- **Arka Plan Görevleri (Background Jobs):** Hangfire ve PostgreSQL altyapısı ile belirli aralıklarla mailleri kontrol edip özetleyen otomatik süreçler.
- **Sohbet Geçmişi (Chat History):** PostgreSQL veritabanı sayesinde bağlamı koparmayan, geçmişi hatırlayan zeki iletişim.
- **Clean Architecture:** Temiz mimari prensipleriyle (Core, Infrastructure, Agent, API) katmanlı yapı.

## 🛠️ Kullanılan Teknolojiler

- **Backend:** .NET 10, ASP.NET Core Web API
- **AI / Agent:** Microsoft Semantic Kernel
- **LLM Sağlayıcı:** Google Gemini API
- **Veritabanı & ORM:** PostgreSQL, Entity Framework Core
- **Arka Plan Görev Yöneticisi:** Hangfire (PostgreSql Storage)
- **Dış Servisler:** Twilio (WhatsApp), Google Workspace (Gmail API)

## 📦 Kurulum ve Çalıştırma

Projede API anahtarlarının açıkta kalmaması için `.NET User Secrets` kullanılmıştır. Projeyi ayağa kaldırmak için aşağıdaki adımları izleyin.

### 1. Gereksinimler
- .NET 10 SDK
- PostgreSQL Server
- ngrok (WhatsApp Webhook'unu test etmek için)

### 2. User Secrets (Şifrelerin) Ayarlanması
Projeyi klonladıktan sonra API klasörüne giderek aşağıdaki secrets komutlarını kendi bilgilerinizle çalıştırın:

```bash
cd EmailAgent.API
dotnet user-secrets init

# Gemini API Anahtarı
dotnet user-secrets set "AI:ApiKey" "YOUR_GEMINI_API_KEY"

# Twilio (WhatsApp) Bilgileri
dotnet user-secrets set "Twilio:AccountSid" "YOUR_TWILIO_SID"
dotnet user-secrets set "Twilio:AuthToken" "YOUR_TWILIO_TOKEN"

# Gmail API Bilgileri
dotnet user-secrets set "Gmail:ClientSecret" "YOUR_GMAIL_CLIENT_SECRET"
```

*Not: Gmail ClientId ve PostgreSQL Connection String `appsettings.Local.json` üzerinden varsayılan olarak okunmaktadır, isterseniz değiştirebilirsiniz.*

### 3. Veritabanı (Migration)
Proje ayağa kalkarken `Program.cs` içerisindeki seed mekanizması veritabanı tablolarını (`EmailAnalysis`, `UserPreferences`, `ChatHistory`) ve Hangfire tablolarını otomatik olarak oluşturur. Ekstra bir migration komutu çalıştırmanıza gerek yoktur.

### 4. Projeyi Başlatma
```bash
dotnet run --project EmailAgent.API
```
Uygulama `http://localhost:5209` portunda ayağa kalkacaktır.

### 5. WhatsApp Webhook Bağlantısı (Twilio)
Yerelde çalışırken WhatsApp mesajlarını alabilmek için ngrok kullanın:
```bash
ngrok http 5209
```
Oluşan HTTPS adresini Twilio Console'da `Sandbox for WhatsApp` -> `When a message comes in` kısmına `https://YOUR_NGROK_URL/api/whatsapp/webhook` şeklinde yapıştırın.

## 🧠 Nasıl Kullanılır?

Kurulumlar tamamlandıktan sonra Twilio Sandbox numaranıza WhatsApp üzerinden mesaj atın:
- _"Selam, nasılsın?"_
- _"Bana son gelen 5 e-postanın bir özetini çıkarır mısın?"_
- _"Ahmet'e (ahmet@ornek.com) yarınki toplantının ertelendiğine dair kibar bir e-posta yolla."_

Yapay zeka (Gemini) niyetinizi anlayacak, gerekli fonksiyonları (Tool Calling) tetikleyecek ve işlemleri saniyeler içinde halledip size WhatsApp'tan bilgi verecektir.

---
*Geliştirici:* [Sizin İsminiz/Nickiniz]*
*Lisans:* MIT
