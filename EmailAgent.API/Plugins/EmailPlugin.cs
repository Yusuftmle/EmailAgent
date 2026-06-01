using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Infrastructure.Gmail;

namespace EmailAgent.API.Plugins;

public class EmailPlugin
{
    private readonly IGmailService _gmailService;
    private readonly EmailAgent.Core.Entities.UserPreferences _user;

    public EmailPlugin(IGmailService gmailService, EmailAgent.Core.Entities.UserPreferences user)
    {
        _gmailService = gmailService;
        _user = user;
    }

    [KernelFunction("send_email")]
    [Description("Sends an email to the specified recipient. Use this when the user asks to send an email, reply to an email, or schedule a meeting via email.")]
    public async Task<string> SendEmailAsync(
        [Description("The recipient's email address")] string to,
        [Description("The subject of the email")] string subject,
        [Description("The body/content of the email. Can include meeting details, plain text, etc.")] string body)
    {
        try
        {
            await _gmailService.SendEmailAsync(to, subject, body, _user);
            return $"Successfully sent email to {to} with subject '{subject}'.";
        }
        catch (System.Exception ex)
        {
            return $"FAILED to send email: {ex.Message}. Tell the user that the Gmail API is currently not configured or encountered an error.";
        }
    }
}
