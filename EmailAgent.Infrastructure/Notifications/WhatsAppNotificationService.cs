using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Repositories;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace EmailAgent.Infrastructure.Notifications;

public interface IWhatsAppNotificationService
{
    Task SendDailySummaryAsync(EmailAgent.Core.Entities.UserPreferences user, int importantCount, string dashboardUrl);
    Task SendMessageAsync(EmailAgent.Core.Entities.UserPreferences user, string toPhoneNumber, string messageBody);
}

public class WhatsAppNotificationService : IWhatsAppNotificationService
{
    private readonly IConfiguration _config;
    private readonly ILogger<WhatsAppNotificationService> _logger;

    public WhatsAppNotificationService(
        IConfiguration config, 
        ILogger<WhatsAppNotificationService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private (string accountSid, string authToken, string fromWhatsApp) GetTwilioCredentials(EmailAgent.Core.Entities.UserPreferences user)
    {
        var accountSid = !string.IsNullOrEmpty(user?.WhatsAppSid) ? user.WhatsAppSid : _config["Twilio:AccountSid"];
        var authToken = !string.IsNullOrEmpty(user?.WhatsAppToken) ? user.WhatsAppToken : _config["Twilio:AuthToken"];
        var fromWhatsApp = !string.IsNullOrEmpty(user?.WhatsAppFrom) ? user.WhatsAppFrom : _config["Twilio:WhatsAppFrom"];

        // Ensure "whatsapp:" prefix for From number, crucial for Sandbox
        if (!string.IsNullOrEmpty(fromWhatsApp) && !fromWhatsApp.StartsWith("whatsapp:"))
        {
            fromWhatsApp = "whatsapp:" + fromWhatsApp;
        }

        return (accountSid ?? "", authToken ?? "", fromWhatsApp ?? "");
    }

    private string FormatToWhatsAppNumber(string toWhatsApp)
    {
        if (string.IsNullOrEmpty(toWhatsApp)) return "";

        var cleanNumber = toWhatsApp.Replace("whatsapp:", "").Trim();
        if (cleanNumber.StartsWith("05"))
        {
            cleanNumber = "+90" + cleanNumber.Substring(1);
        }
        else if (cleanNumber.StartsWith("5") && cleanNumber.Length == 10)
        {
            cleanNumber = "+90" + cleanNumber;
        }
        else if (!cleanNumber.StartsWith("+"))
        {
            cleanNumber = "+" + cleanNumber;
        }
        return "whatsapp:" + cleanNumber;
    }

    public async Task SendMessageAsync(EmailAgent.Core.Entities.UserPreferences user, string toPhoneNumber, string messageBody)
    {
        try
        {
            var (accountSid, authToken, fromWhatsApp) = GetTwilioCredentials(user);
            var toWhatsApp = FormatToWhatsAppNumber(toPhoneNumber);

            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken) || 
                string.IsNullOrEmpty(fromWhatsApp) || string.IsNullOrEmpty(toWhatsApp) ||
                accountSid == "YOUR_TWILIO_ACCOUNT_SID")
            {
                _logger.LogWarning("Twilio WhatsApp is not fully configured. Skipping message sending.");
                return;
            }

            _logger.LogInformation("Sending WhatsApp message via Twilio (To: {To})...", toWhatsApp);
            TwilioClient.Init(accountSid, authToken);

            var message = await MessageResource.CreateAsync(
                body: messageBody,
                from: new PhoneNumber(fromWhatsApp),
                to: new PhoneNumber(toWhatsApp)
            );

            _logger.LogInformation("WhatsApp message sent. SID: {Sid}", message.Sid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WhatsApp message via Twilio.");
        }
    }

    public async Task SendDailySummaryAsync(EmailAgent.Core.Entities.UserPreferences user, int importantCount, string dashboardUrl)
    {
        var toWhatsApp = !string.IsNullOrEmpty(user?.WhatsAppTo) ? user.WhatsAppTo : _config["Twilio:WhatsAppTo"];
        
        var messageBody = $"📧 Daily Email Summary\n" +
                          $"✅ {importantCount} important emails\n" +
                          $"📋 Dashboard: {dashboardUrl}";

        await SendMessageAsync(user, toWhatsApp ?? "", messageBody);
    }
}
