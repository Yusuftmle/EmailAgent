using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Telegram.Bot;
using Telegram.Bot.Types;

namespace EmailAgent.Infrastructure.Notifications;

public interface ITelegramNotificationService
{
    Task SendDailySummaryAsync(EmailAgent.Core.Entities.UserPreferences user, int importantCount, string dashboardUrl, CancellationToken cancellationToken = default);
    Task SendMessageAsync(EmailAgent.Core.Entities.UserPreferences user, string chatIdStr, string message, CancellationToken cancellationToken = default);
}

public class TelegramNotificationService : ITelegramNotificationService
{
    private readonly IConfiguration _config;
    private readonly ILogger<TelegramNotificationService> _logger;

    public TelegramNotificationService(IConfiguration config, ILogger<TelegramNotificationService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendDailySummaryAsync(EmailAgent.Core.Entities.UserPreferences user, int importantCount, string dashboardUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var botToken = !string.IsNullOrEmpty(user?.TelegramBotToken) ? user.TelegramBotToken : _config["Telegram:BotToken"];
            var chatIdStr = !string.IsNullOrEmpty(user?.TelegramChatId) ? user.TelegramChatId : _config["Telegram:ChatId"];

            if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(chatIdStr))
            {
                _logger.LogWarning("Telegram is not configured. BotToken or ChatId is missing in appsettings.json.");
                return;
            }

            _logger.LogInformation("Sending Telegram daily summary notification...");
            var botClient = new TelegramBotClient(botToken);
            var chatId = new ChatId(chatIdStr);

            var message = $"📧 Daily Email Summary\n" +
                          $"✅ {importantCount} important emails\n" +
                          $"📋 Dashboard: {dashboardUrl}";

            await botClient.SendMessage(
                chatId: chatId,
                text: message,
                cancellationToken: cancellationToken
            );

            _logger.LogInformation("Telegram notification sent successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Telegram notification.");
        }
    }

    public async Task SendMessageAsync(EmailAgent.Core.Entities.UserPreferences user, string chatIdStr, string message, CancellationToken cancellationToken = default)
    {
        try
        {
            var botToken = !string.IsNullOrEmpty(user?.TelegramBotToken) ? user.TelegramBotToken : _config["Telegram:BotToken"];
            if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(chatIdStr)) return;

            var botClient = new TelegramBotClient(botToken);
            var chatId = new ChatId(chatIdStr);

            await botClient.SendMessage(
                chatId: chatId,
                text: message,
                cancellationToken: cancellationToken
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send direct Telegram notification.");
        }
    }
}
