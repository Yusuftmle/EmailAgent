using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Infrastructure.Gmail;

namespace EmailAgent.Agent.Chat.Plugins;

public class EmailPlugin
{
    private readonly IGmailService _gmailService;

    public EmailPlugin(IGmailService gmailService)
    {
        _gmailService = gmailService;
    }

    [KernelFunction("send_email")]
    [Description("Sends an email to the specified recipient. Use this when the user asks to send an email, reply to an email, or schedule a meeting via email.")]
    public async Task<string> SendEmailAsync(
        [Description("The recipient's email address")] string to,
        [Description("The subject of the email")] string subject,
        [Description("The body/content of the email. Can include meeting details, plain text, etc.")] string body)
    {
        await _gmailService.SendEmailAsync(to, subject, body);
        return $"Successfully sent email to {to} with subject '{subject}'.";
    }
}
