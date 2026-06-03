using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Notifications;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Agent.Core;
using Microsoft.EntityFrameworkCore;

namespace EmailAgent.Infrastructure.Jobs;

public class DailyBriefingJob
{
    private readonly IUserPreferencesRepository _prefRepo;
    private readonly ITelegramNotificationService _telegramService;
    private readonly EmailAgentDbContext _dbContext;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DailyBriefingJob> _logger;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;

    public DailyBriefingJob(
        IUserPreferencesRepository prefRepo,
        ITelegramNotificationService telegramService,
        EmailAgentDbContext dbContext,
        IServiceProvider serviceProvider,
        IHttpClientFactory httpClientFactory,
        ILogger<DailyBriefingJob> logger,
        Microsoft.Extensions.Configuration.IConfiguration config)
    {
        _prefRepo = prefRepo;
        _telegramService = telegramService;
        _dbContext = dbContext;
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _config = config;
    }

    public async Task SendMorningBriefingAsync()
    {
        _logger.LogInformation("Starting Daily Briefing Job...");
        var users = await _prefRepo.GetAllAsync();

        foreach (var user in users)
        {
            if (string.IsNullOrEmpty(user.TelegramChatId)) continue;

            try
            {
                // 1. Fetch Weather
                string weather = "Bilinmiyor";
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    // format=3 returns something like "Istanbul: ⛅️ +15°C"
                    weather = await client.GetStringAsync("https://wttr.in/Istanbul?format=3");
                }
                catch { }

                // 2. Fetch Yesterday's Important Emails
                var yesterday = DateTime.UtcNow.AddDays(-1);
                var importantEmails = await _dbContext.EmailAnalyses
                    .Where(e => e.UserId == user.Id && e.Importance == "important" && e.ProcessedAt >= yesterday)
                    .ToListAsync();
                
                var emailSummary = importantEmails.Any() 
                    ? string.Join("\n", importantEmails.Select(e => $"- Kimden: {e.From}, Konu: {e.Subject}")) 
                    : "Önemli yeni e-posta yok.";

                // 3. Fetch Tracked Products that dropped in price
                var trackedProducts = await _dbContext.TrackedProducts
                    .Where(p => p.UserId == user.Id && p.LastKnownPrice <= p.TargetPrice && p.IsActive)
                    .ToListAsync();
                
                var productsSummary = trackedProducts.Any()
                    ? string.Join("\n", trackedProducts.Select(p => $"- {p.Title}: {p.LastKnownPrice} {p.Currency} (Hedef: {p.TargetPrice})"))
                    : "Hedef fiyata düşen ürün yok.";

                // 4. Generate AI Message
                var provider = string.IsNullOrEmpty(user.AiProvider) ? "Gemini" : user.AiProvider;
                var apiKey = string.IsNullOrWhiteSpace(user.ApiKey) ? _config[$"{provider}:ApiKey"] : user.ApiKey;
                var kernel = new AegisKernelBuilder(_serviceProvider)
                    .UseModel(provider, "gemini-flash-latest", apiKey, _httpClientFactory.CreateClient("AIAgentClient"))
                    .Build();

                var chatService = kernel.GetRequiredService<IChatCompletionService>();
                var persona = user.AssistantPersona ?? "Sen enerjik, samimi ve motive edici bir yapay zeka asistanısın.";
                var chatHistory = new ChatHistory($"Sen kullanıcının kişisel yapay zeka asistanısın. Görevin, ona her sabah aşağıdaki karakter ve davranış profiline uygun bir 'Günaydın / Sabah Bülteni' mesajı hazırlamak.\nSenin Karakterin: {persona}\nSadece aşağıdaki verileri kullanarak kısa ve şık bir özet yaz.");
                
                string prompt = $@"
Kullanıcı Adı: {user.Name ?? "Yusuf"}
Hava Durumu: {weather}
Dünün Önemli E-postaları:
{emailSummary}
İndirime Giren Ürünleri:
{productsSummary}
Bugünkü Toplantıları: (Şu an takvim entegrasyonu yok, 'Günün boş görünüyor, harika bir gün!' diyebilirsin).
Lütfen WhatsApp/Telegram'a uygun şık bir bülten metni oluştur.";

                chatHistory.AddUserMessage(prompt);
                
                var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
                var message = response.Content ?? "Günaydın! Harika bir gün dilerim.";

                // 5. Send via Telegram
                await _telegramService.SendMessageAsync(user.TelegramChatId, message);
                _logger.LogInformation("Sent Daily Briefing to user {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send briefing to user {UserId}", user.Id);
            }
        }
    }
}
