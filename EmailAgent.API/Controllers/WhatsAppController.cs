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

        // Run chat processing in background so we don't block the Twilio webhook response
        // Twilio requires a fast response (typically < 15 seconds)
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
            var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppNotificationService>();
            
            try
            {
                // We use the phone number as the SessionId for chat history
                var response = await chatService.SendMessageAsync(fromNumber, body);
                
                // Send the AI's response back to the user via WhatsApp
                await whatsAppService.SendMessageAsync(fromNumber, response);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error processing WhatsApp message from {From}", fromNumber);
                await whatsAppService.SendMessageAsync(fromNumber, "Sorry, I encountered an error while processing your request.");
            }
        });

        // Return empty TwiML immediately so Twilio knows we received the message
        var responseTwiML = new MessagingResponse();
        return Content(responseTwiML.ToString(), "text/xml");
    }
}
