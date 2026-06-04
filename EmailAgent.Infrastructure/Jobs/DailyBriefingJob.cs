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
using EmailAgent.Infrastructure.GoogleCalendar;

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
    private readonly IGoogleCalendarService _googleCalendarService;

    public DailyBriefingJob(
        IUserPreferencesRepository prefRepo,
        ITelegramNotificationService telegramService,
        EmailAgentDbContext dbContext,
        IServiceProvider serviceProvider,
        IHttpClientFactory httpClientFactory,
        ILogger<DailyBriefingJob> logger,
        Microsoft.Extensions.Configuration.IConfiguration config,
        IGoogleCalendarService googleCalendarService)
    {
        _prefRepo = prefRepo;
        _telegramService = telegramService;
        _dbContext = dbContext;
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _config = config;
        _googleCalendarService = googleCalendarService;
    }

    public async Task SendMorningBriefingForUserAsync(Guid userId)
    {
        _logger.LogInformation("Starting Daily Briefing Job for user {UserId}...", userId);
        var user = await _prefRepo.GetByIdAsync(userId);
        
        if (user == null || string.IsNullOrEmpty(user.TelegramChatId)) 
        {
            _logger.LogInformation("User {UserId} not found or TelegramChatId is empty. Skipping briefing.", userId);
            return;
        }

            try
            {
                // 1. Fetch Weather
                string weather = "Bilinmiyor";
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var city = string.IsNullOrWhiteSpace(user.City) ? "Istanbul" : user.City;
                    weather = await client.GetStringAsync($"https://wttr.in/{Uri.EscapeDataString(city)}?format=3");
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

                // 4. Fetch Agenda Events for Today
                var userTimezone = TimeZoneInfo.FindSystemTimeZoneById(user.Timezone ?? "Europe/Istanbul");
                var userToday = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, userTimezone).Date;
                var startOfDayUtc = TimeZoneInfo.ConvertTimeToUtc(userToday, userTimezone);
                var endOfDayUtc = TimeZoneInfo.ConvertTimeToUtc(userToday.AddDays(1).AddTicks(-1), userTimezone);

                var todaysEvents = await _dbContext.CalendarEvents
                    .Where(e => e.UserId == user.Id && e.EventDate >= startOfDayUtc && e.EventDate <= endOfDayUtc)
                    .ToListAsync();
                
                try
                {
                    var googleEvents = await _googleCalendarService.GetUpcomingEventsAsync(user, startOfDayUtc, endOfDayUtc);
                    foreach(var ge in googleEvents)
                    {
                        if (!todaysEvents.Any(le => le.GoogleEventId == ge.GoogleEventId))
                        {
                            todaysEvents.Add(ge);
                        }
                    }
                }
                catch (Exception)
                {
                    // Ignore google fetch errors
                }
                
                var orderedEvents = todaysEvents.OrderBy(e => e.EventDate).ToList();

                var agendaSummary = orderedEvents.Any()
                    ? string.Join("\n", orderedEvents.Select(e => $"- {TimeZoneInfo.ConvertTimeFromUtc(e.EventDate, userTimezone).ToString("HH:mm")}: {e.Title} {(string.IsNullOrWhiteSpace(e.Description) ? "" : "(" + e.Description + ")")}"))
                    : "Günün boş görünüyor, harika bir gün!";

                // 5. Generate AI Message
                var provider = string.IsNullOrEmpty(user.AiProvider) ? "Gemini" : user.AiProvider;
                var apiKey = string.IsNullOrWhiteSpace(user.ApiKey) ? _config[$"{provider}:ApiKey"] : user.ApiKey;
                var kernel = new AegisKernelBuilder(_serviceProvider)
                    .UseModel(provider, "gemini-flash-latest", apiKey, _httpClientFactory.CreateClient("AIAgentClient"))
                    .Build();

                var chatService = kernel.GetRequiredService<IChatCompletionService>();
                var persona = user.AssistantPersona ?? "Sen enerjik, samimi ve motive edici bir yapay zeka asistanısın.";
                var chatHistory = new ChatHistory($"Sen kullanıcının kişisel yapay zeka asistanısın. Görevin, ona her sabah aşağıdaki karakter ve davranış profiline uygun bir 'Günaydın / Sabah Bülteni' mesajı hazırlamak.\nSenin Karakterin: {persona}\nSadece aşağıdaki verileri kullanarak kısa ve şık bir özet yaz. Ajandada etkinlik varsa onları mutlaka saatleriyle birlikte vurgula.");
                
                string prompt = $@"
Kullanıcı Adı: {user.Name ?? "Yusuf"}
Hava Durumu: {weather}
Dünün Önemli E-postaları:
{emailSummary}
İndirime Giren Ürünleri:
{productsSummary}
Bugünkü Toplantıları / Ajandası:
{agendaSummary}
Lütfen WhatsApp/Telegram'a uygun şık bir bülten metni oluştur.";

                chatHistory.AddUserMessage(prompt);
                
                var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
                var message = response.Content ?? "Günaydın! Harika bir gün dilerim.";

                // 5. Send via Telegram
                await _telegramService.SendMessageAsync(user, user.TelegramChatId, message);
                _logger.LogInformation("Sent Daily Briefing to user {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send briefing to user {UserId}", user.Id);
            }
    }
}
