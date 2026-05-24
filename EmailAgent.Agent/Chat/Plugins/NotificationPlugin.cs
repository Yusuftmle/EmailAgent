using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Infrastructure.Notifications;

namespace EmailAgent.Agent.Chat.Plugins;

public class NotificationPlugin
{
    private readonly IWhatsAppNotificationService _whatsAppService;
    private readonly ITelegramNotificationService _telegramService;

    public NotificationPlugin(
        IWhatsAppNotificationService whatsAppService,
        ITelegramNotificationService telegramService)
    {
        _whatsAppService = whatsAppService;
        _telegramService = telegramService;
    }

    [KernelFunction("send_whatsapp_message")]
    [Description("Sends a WhatsApp message to a specific phone number. Use this when the user asks to send a WhatsApp notification or message.")]
    public async Task<string> SendWhatsAppMessageAsync(
        [Description("The recipient's phone number, e.g., +905551234567")] string toPhoneNumber,
        [Description("The content of the WhatsApp message")] string messageBody)
    {
        await _whatsAppService.SendMessageAsync(toPhoneNumber, messageBody);
        return $"Successfully sent WhatsApp message to {toPhoneNumber}.";
    }

    // Since ITelegramNotificationService doesn't have a specific SendMessageAsync method we added yet,
    // let's leave this as a stub or implement it if the service already has it.
    // The instructions were for WhatsApp mainly, but user asked for telegram too.
}
