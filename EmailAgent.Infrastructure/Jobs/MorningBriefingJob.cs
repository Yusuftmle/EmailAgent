using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Infrastructure.Notifications;
using EmailAgent.Core.Entities;

namespace EmailAgent.Infrastructure.Jobs;

/// <summary>
/// Runs every 5 minutes to:
/// 1. Fire pending reminders.
/// 2. Send morning briefing at 05:00 UTC (08:00 Turkey time).
/// </summary>
public class MorningBriefingJob
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly ITelegramNotificationService _telegramService;
    private readonly ILogger<MorningBriefingJob> _logger;

    public MorningBriefingJob(EmailAgentDbContext dbContext, ITelegramNotificationService telegramService, ILogger<MorningBriefingJob> logger)
    {
        _dbContext = dbContext;
        _telegramService = telegramService;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        await ProcessRemindersAsync();
        await SendMorningBriefingsAsync();
    }

    private async Task ProcessRemindersAsync()
    {
        var dueReminders = await _dbContext.Reminders
            .Where(r => !r.IsSent && r.RemindAt <= DateTime.UtcNow)
            .ToListAsync();

        foreach (var reminder in dueReminders)
        {
            var userPrefs = await _dbContext.UserPreferences.FindAsync(reminder.UserId);
            if (userPrefs == null) continue;

            var msg = $"⏰ **HATIRLATICI** ⏰\n\n{reminder.Message}";

            if (!string.IsNullOrEmpty(userPrefs.TelegramChatId))
                await _telegramService.SendMessageAsync(userPrefs, userPrefs.TelegramChatId, msg);

            reminder.IsSent = true;

            _dbContext.NotificationLogs.Add(new NotificationLog
            {
                UserId = reminder.UserId,
                Message = msg,
                Type = "Reminder",
                SentAt = DateTime.UtcNow
            });

            _logger.LogInformation("Reminder sent to user {UserId}: {Message}", reminder.UserId, reminder.Message);
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task SendMorningBriefingsAsync()
    {
        // Send between 05:00–05:05 UTC (08:00 Turkey time)
        var utcNow = DateTime.UtcNow;
        if (utcNow.Hour != 5 || utcNow.Minute > 5) return;

        var allUsers = await _dbContext.UserPreferences
            .Where(u => !string.IsNullOrEmpty(u.TelegramChatId))
            .ToListAsync();

        foreach (var user in allUsers)
        {
            try
            {
                var products = await _dbContext.TrackedProducts
                    .Where(p => p.UserId == user.Id && p.IsActive)
                    .ToListAsync();

                var sb = new StringBuilder();
                sb.AppendLine("🌅 **Günaydın! İşte bugünkü özet:**\n");

                if (products.Any())
                {
                    sb.AppendLine("📦 **Takip Ettiğin Ürünler:**");
                    foreach (var p in products.Take(5))
                    {
                        var status = p.LastKnownPrice <= p.TargetPrice ? "✅ HEDEF FİYATA ULAŞTI!" : $"Fiyat: {p.LastKnownPrice} {p.Currency}";
                        sb.AppendLine($"• {p.Title} — {status}");
                    }
                }
                else
                {
                    sb.AppendLine("📦 Takip ettiğin ürün yok.");
                }

                var recentNotifs = await _dbContext.NotificationLogs
                    .Where(n => n.UserId == user.Id && n.SentAt >= DateTime.UtcNow.AddHours(-24))
                    .CountAsync();

                if (recentNotifs > 0)
                    sb.AppendLine($"\n🔔 Son 24 saatte {recentNotifs} fırsat bildirimi gönderildi!");

                sb.AppendLine("\nHarika bir gün sana! 🚀");

                await _telegramService.SendMessageAsync(user, user.TelegramChatId!, sb.ToString());

                _dbContext.NotificationLogs.Add(new NotificationLog
                {
                    UserId = user.Id,
                    Message = sb.ToString(),
                    Type = "MorningBriefing",
                    SentAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send morning briefing to user {UserId}", user.Id);
            }
        }

        await _dbContext.SaveChangesAsync();
    }
}
