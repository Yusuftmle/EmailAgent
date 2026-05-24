using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Agent.Chat;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    [HttpPost("message")]
    public async Task<ActionResult<ChatResponseDto>> SendMessage([FromBody] ChatRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Message content cannot be empty.");
        }

        try
        {
            var sessionId = string.IsNullOrWhiteSpace(request.SessionId) ? "default-session" : request.SessionId;
            _logger.LogInformation("Chat Message received for session: {SessionId}", sessionId);

            var reply = await _chatService.SendMessageAsync(sessionId, request.Message);

            return Ok(new ChatResponseDto
            {
                Reply = reply,
                SessionId = sessionId,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process chat message.");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<ChatHistory>>> GetHistory([FromQuery] string? sessionId)
    {
        try
        {
            var targetSession = string.IsNullOrWhiteSpace(sessionId) ? "default-session" : sessionId;
            _logger.LogInformation("Retrieving chat history for session: {SessionId}", targetSession);

            var history = await _chatService.GetHistoryAsync(targetSession);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve chat history.");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("history")]
    public async Task<IActionResult> ClearHistory([FromQuery] string? sessionId)
    {
        try
        {
            var targetSession = string.IsNullOrWhiteSpace(sessionId) ? "default-session" : sessionId;
            _logger.LogInformation("Clearing chat history for session: {SessionId}", targetSession);

            await _chatService.ClearHistoryAsync(targetSession);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear chat history.");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class ChatRequestDto
{
    public string SessionId { get; set; } = "default-session";
    public string Message { get; set; } = string.Empty;
}

public class ChatResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
