using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using EmailAgent.Agent.Chat;
using EmailAgent.Core.Repositories;

namespace EmailAgent.API.Services;

public class TelegramBotHostedService : BackgroundService
{
    private readonly ILogger<TelegramBotHostedService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _botToken;

    public TelegramBotHostedService(
        ILogger<TelegramBotHostedService> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _botToken = configuration["Telegram:BotToken"] ?? string.Empty;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(_botToken) || _botToken.Contains("your_telegram_bot_token") || _botToken.Length < 10)
        {
            _logger.LogWarning("Telegram Bot Token is missing or invalid. Polling service will not start.");
            return;
        }

        TelegramBotClient botClient;
        try
        {
            botClient = new TelegramBotClient(_botToken);
        }
        catch (ArgumentException)
        {
            _logger.LogWarning("Telegram Bot Token format is invalid. Polling service will not start.");
            return;
        }

        ReceiverOptions receiverOptions = new()
        {
            AllowedUpdates = Array.Empty<UpdateType>() // receive all update types
        };

        botClient.StartReceiving(
            updateHandler: HandleUpdateAsync,
            errorHandler: HandlePollingErrorAsync,
            receiverOptions: receiverOptions,
            cancellationToken: stoppingToken
        );

        var me = await botClient.GetMe(stoppingToken);
        _logger.LogInformation($"Start listening for @{me.Username}");

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        if (update.Message is not { } message)
            return;

        if (message.Text is not { } messageText)
            return;

        var chatId = message.Chat.Id;
        _logger.LogInformation($"Received a '{messageText}' message in chat {chatId}.");

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var userPrefsRepo = scope.ServiceProvider.GetRequiredService<IUserPreferencesRepository>();
            var currentUser = await userPrefsRepo.GetByTelegramChatIdAsync(chatId.ToString());

            // 1. Is this a pairing request? (e.g., "/start 1234-abcd..." or just "1234-abcd...")
            if (messageText.Contains('-') && messageText.Length >= 32)
            {
                var inputGuid = messageText.Replace("/start", "").Trim();
                
                var pairedUser = await userPrefsRepo.GetByPairingCodeAsync(inputGuid);
                if (pairedUser != null)
                {
                    pairedUser.TelegramChatId = chatId.ToString();
                    await userPrefsRepo.SaveAsync(pairedUser);
                    await botClient.SendMessage(chatId, "✅ Account successfully paired! You can now chat with OmniAgent.", cancellationToken: cancellationToken);
                    return;
                }
                else
                {
                    await botClient.SendMessage(chatId, "❌ Invalid or expired Pairing Code.", cancellationToken: cancellationToken);
                    return;
                }
            }

            if (currentUser == null)
            {
                await botClient.SendMessage(chatId, "🔒 Access Denied. Please send your 36-character Pairing Code from the Web Panel to link your account.", cancellationToken: cancellationToken);
                return;
            }

            // 3. Authorized user found, proceed to process message
            var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
            
            // Send a "typing..." action while AI thinks
            await botClient.SendChatAction(chatId, ChatAction.Typing, cancellationToken: cancellationToken);

            var response = await chatService.SendMessageAsync(currentUser.Id.ToString(), messageText);

            await botClient.SendMessage(
                chatId: chatId,
                text: response,
                cancellationToken: cancellationToken
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Telegram message");
            await botClient.SendMessage(
                chatId: chatId,
                text: "Sorry, I encountered an error processing your request.",
                cancellationToken: cancellationToken
            );
        }
    }

    private Task HandlePollingErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
    {
        var ErrorMessage = exception switch
        {
            ApiRequestException apiRequestException
                => $"Telegram API Error:\n[{apiRequestException.ErrorCode}]\n{apiRequestException.Message}",
            _ => exception.ToString()
        };

        _logger.LogError(ErrorMessage);
        return Task.CompletedTask;
    }
}
