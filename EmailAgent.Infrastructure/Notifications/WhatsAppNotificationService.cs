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
    Task SendDailySummaryAsync(int importantCount, string dashboardUrl);
    Task SendMessageAsync(string toPhoneNumber, string messageBody);
}

public class WhatsAppNotificationService : IWhatsAppNotificationService
{
    private readonly IConfiguration _config;
    private readonly IUserPreferencesRepository _prefRepo;
    private readonly ILogger<WhatsAppNotificationService> _logger;

    public WhatsAppNotificationService(
        IConfiguration config, 
        IUserPreferencesRepository prefRepo,
        ILogger<WhatsAppNotificationService> logger)
    {
        _config = config;
        _prefRepo = prefRepo;
        _logger = logger;
    }

    private async Task<(string accountSid, string authToken, string fromWhatsApp)> GetTwilioCredentialsAsync()
    {
        var prefs = await _prefRepo.GetAsync();

        var accountSid = !string.IsNullOrEmpty(prefs?.WhatsAppSid) ? prefs.WhatsAppSid : _config["Twilio:AccountSid"];
        var authToken = !string.IsNullOrEmpty(prefs?.WhatsAppToken) ? prefs.WhatsAppToken : _config["Twilio:AuthToken"];
        var fromWhatsApp = !string.IsNullOrEmpty(prefs?.WhatsAppFrom) ? prefs.WhatsAppFrom : _config["Twilio:WhatsAppFrom"];

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
        else if (!cleanNumber.StartsWith("+"))
        {
            cleanNumber = "+" + cleanNumber;
        }
        return "whatsapp:" + cleanNumber;
    }

    public async Task SendMessageAsync(string toPhoneNumber, string messageBody)
    {
        try
        {
            var (accountSid, authToken, fromWhatsApp) = await GetTwilioCredentialsAsync();
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

    public async Task SendDailySummaryAsync(int importantCount, string dashboardUrl)
    {
        var prefs = await _prefRepo.GetAsync();
        var toWhatsApp = !string.IsNullOrEmpty(prefs?.WhatsAppTo) ? prefs.WhatsAppTo : _config["Twilio:WhatsAppTo"];
        
        var messageBody = $"📧 Daily Email Summary\n" +
                          $"✅ {importantCount} important emails\n" +
                          $"📋 Dashboard: {dashboardUrl}";

        await SendMessageAsync(toWhatsApp ?? "", messageBody);
    }
}
