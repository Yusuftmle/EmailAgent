using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Twilio.TwiML;
using EmailAgent.Agent.Chat;
using EmailAgent.Infrastructure.Notifications;
using Microsoft.Extensions.DependencyInjection;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/whatsapp")]
public class WhatsAppController : ControllerBase
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WhatsAppController> _logger;

    public WhatsAppController(
        IServiceScopeFactory scopeFactory,
        ILogger<WhatsAppController> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [HttpPost("webhook")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> ReceiveMessage([FromForm] IFormCollection form)
    {
        var fromNumber = form["From"].ToString();
        var body = form["Body"].ToString();

        _logger.LogInformation("Received WhatsApp message from {From}: {Body}", fromNumber, body);

        if (string.IsNullOrEmpty(fromNumber) || string.IsNullOrEmpty(body))
        {
            return BadRequest("Invalid payload.");
        }

        // Extract Twilio validation parameters before the HttpContext is disposed
        var signature = Request.Headers["X-Twilio-Signature"].ToString();
        var url = $"{Request.Scheme}://{Request.Host}{Request.Path}{Request.QueryString}";
        var formDictionary = form.ToDictionary(k => k.Key, v => v.Value.ToString());

        // Run chat processing in background so we don't block the Twilio webhook response
        // Twilio requires a fast response (typically < 15 seconds)
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
            var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppNotificationService>();
            var prefRepo = scope.ServiceProvider.GetRequiredService<EmailAgent.Core.Repositories.IUserPreferencesRepository>();
            
            try
            {
                var user = await prefRepo.GetByWhatsAppNumberAsync(fromNumber);
                if (user == null) {
                    _logger.LogWarning("No user found for WhatsApp number: {From}", fromNumber);
                    return;
                }

                // Verify Twilio Signature for Security
                if (!string.IsNullOrEmpty(user.WhatsAppToken))
                {
                    var validator = new Twilio.Security.RequestValidator(user.WhatsAppToken);
                    if (!validator.Validate(url, formDictionary, signature))
                    {
                        _logger.LogWarning("Invalid Twilio signature from {From}. Possible webhook spoofing attempt.", fromNumber);
                        return;
                    }
                }

                // We use the UserId as the SessionId for chat history
                var response = await chatService.SendMessageAsync(user.Id.ToString(), body);
                
                // Send the AI's response back to the user via WhatsApp
                await whatsAppService.SendMessageAsync(user, fromNumber, response);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error processing WhatsApp message from {From}", fromNumber);
                
                var user = await prefRepo.GetByWhatsAppNumberAsync(fromNumber);
                if (user != null)
                    await whatsAppService.SendMessageAsync(user, fromNumber, "Sorry, I encountered an error while processing your request.");
            }
        });

        // Return empty TwiML immediately so Twilio knows we received the message
        var responseTwiML = new MessagingResponse();
        return Content(responseTwiML.ToString(), "text/xml");
    }
}
