using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Infrastructure.Notifications;

namespace EmailAgent.API.Plugins;

public class NotificationPlugin
{
    private readonly IWhatsAppNotificationService _whatsAppService;
    private readonly ITelegramNotificationService _telegramService;

    private readonly EmailAgent.Core.Entities.UserPreferences _user;

    public NotificationPlugin(
        IWhatsAppNotificationService whatsAppService,
        ITelegramNotificationService telegramService,
        EmailAgent.Core.Entities.UserPreferences user)
    {
        _whatsAppService = whatsAppService;
        _telegramService = telegramService;
        _user = user;
    }

    [KernelFunction("SendWhatsAppMessage")]
    [Description("Sends a direct WhatsApp message to the user. Use this when the user asks you to text them or send them a WhatsApp message.")]
    public async Task<string> SendWhatsAppMessageAsync(
        [Description("The exact message text to send to the user via WhatsApp")] string message)
    {
        try
        {
            var user = _user;
            // Try to extract the user's configured WhatsApp recipient number
            var toPhoneNumber = !string.IsNullOrEmpty(user?.WhatsAppTo) ? user.WhatsAppTo : "";
            
            if (string.IsNullOrEmpty(toPhoneNumber))
                return "Failed to send: User has no configured WhatsApp phone number.";

            await _whatsAppService.SendMessageAsync(user, toPhoneNumber, message);
            return "Successfully sent WhatsApp message to user.";
        }
        catch
        {
            return "Failed to send WhatsApp message.";
        }
    }

    [KernelFunction("SendTelegramMessage")]
    [Description("Sends a direct Telegram message to the user. Use this when the user asks you to text them or send them a Telegram message.")]
    public async Task<string> SendTelegramMessageAsync(
        [Description("The exact message text to send to the user via Telegram")] string message)
    {
        try
        {
            var user = _user;
            var chatId = !string.IsNullOrEmpty(user?.TelegramChatId) ? user.TelegramChatId : "";
            
            if (string.IsNullOrEmpty(chatId))
                return "Failed to send: User has no configured Telegram Chat ID.";

            await _telegramService.SendMessageAsync(user, chatId, message);
            return "Successfully sent Telegram message to user.";
        }
        catch
        {
            return "Failed to send Telegram message.";
        }
    }
}
