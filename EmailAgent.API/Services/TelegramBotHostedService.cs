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
    private DateTimeOffset _startTime;

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

        try
        {
            var me = await botClient.GetMe(stoppingToken);
            _startTime = DateTimeOffset.UtcNow;
            _logger.LogInformation($"Start listening for @{me.Username}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Telegram API. Bot will not be active.");
            return;
        }

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        if (update.Message is not { } message)
            return;

        if (message.Type != MessageType.Text && message.Type != MessageType.Voice && message.Type != MessageType.Document)
            return;

        // Skip stale messages that were sent before this bot instance started.
        // This prevents the infinite loop where Telegram re-delivers old messages on every restart.
        var messageTime = new DateTimeOffset(message.Date, TimeSpan.Zero);
        if (messageTime < _startTime.AddSeconds(-5))
        {
            _logger.LogWarning("Skipping stale message (sent {MessageTime}, bot started {StartTime}): {Text}",
                messageTime, _startTime, message.Text ?? "[non-text]");
            return;
        }

        var chatId = message.Chat.Id;
        string messageText = message.Text ?? string.Empty;

        using var scope = _serviceProvider.CreateScope();

        if (message.Type == MessageType.Voice && message.Voice != null)
        {
            _logger.LogInformation($"Received a voice message in chat {chatId}.");
            await botClient.SendChatAction(chatId, ChatAction.Typing, cancellationToken: cancellationToken);
            
            try
            {
                var fileId = message.Voice.FileId;
                var fileInfo = await botClient.GetFile(fileId, cancellationToken);
                
                using var memoryStream = new System.IO.MemoryStream();
                await botClient.DownloadFile(fileInfo.FilePath ?? string.Empty, memoryStream, cancellationToken);
                memoryStream.Position = 0;

                var sttService = scope.ServiceProvider.GetRequiredService<EmailAgent.Infrastructure.Services.ISpeechToTextService>();
                messageText = await sttService.TranscribeAudioAsync(memoryStream, "voice.ogg", cancellationToken);

                if (string.IsNullOrEmpty(messageText))
                {
                    await botClient.SendMessage(chatId, "❌ Sesinizi anlayamadım veya servis yanıt vermedi. Lütfen tekrar deneyin veya yazın.", cancellationToken: cancellationToken);
                    return;
                }

                await botClient.SendMessage(chatId, $"✍️ _Anlaşılan:_ {messageText}", ParseMode.Markdown, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing voice message");
                await botClient.SendMessage(chatId, "❌ Ses dosyası işlenirken bir hata oluştu.", cancellationToken: cancellationToken);
                return;
            }
        }

        if (message.Type == MessageType.Document && message.Document != null)
        {
            _logger.LogInformation($"Received a document in chat {chatId}.");
            await botClient.SendChatAction(chatId, ChatAction.Typing, cancellationToken: cancellationToken);
            
            try
            {
                var fileId = message.Document.FileId;
                var fileName = message.Document.FileName ?? "document.pdf";
                var fileInfo = await botClient.GetFile(fileId, cancellationToken);
                
                var filePath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), fileName);
                using var fileStream = new System.IO.FileStream(filePath, System.IO.FileMode.Create);
                await botClient.DownloadFile(fileInfo.FilePath ?? string.Empty, fileStream, cancellationToken);
                fileStream.Close();

                string caption = message.Caption ?? "Lütfen bu belgeyi incele/özetle.";
                messageText = $"[Kullanıcı sana Telegram'dan bir dosya gönderdi. Dosya yerel sunucuda şu yola kaydedildi: {filePath}. " +
                              $"Kullanıcının dosya ile ilgili notu/mesajı: '{caption}'. Lütfen DocumentPlugin kullanarak bu dosyanın içeriğini oku ve kullanıcının isteğine cevap ver.]";
                
                await botClient.SendMessage(chatId, "📄 _Belge indirildi, analiz ediliyor..._", ParseMode.Markdown, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing document message");
                await botClient.SendMessage(chatId, "❌ Belge indirilirken bir hata oluştu.", cancellationToken: cancellationToken);
                return;
            }
        }

        if (string.IsNullOrEmpty(messageText))
            return;

        _logger.LogInformation($"Received a '{messageText}' message in chat {chatId}.");

        try
        {
            var userPrefsRepo = scope.ServiceProvider.GetRequiredService<IUserPreferencesRepository>();
            var currentUser = await userPrefsRepo.GetByTelegramChatIdAsync(chatId.ToString());

            // 1. Is this a pairing request? (e.g., "/start 1234-abcd..." or just "1234-abcd...")
            var potentialGuid = messageText.Replace("/start", "").Trim();
            if (Guid.TryParse(potentialGuid, out Guid parsedGuid))
            {
                var inputGuid = parsedGuid.ToString();
                
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
