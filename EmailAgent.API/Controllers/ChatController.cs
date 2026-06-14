using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Agent.Chat;

using System.Security.Claims;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly EmailAgent.Infrastructure.Services.ISpeechToTextService _speechToTextService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, EmailAgent.Infrastructure.Services.ISpeechToTextService speechToTextService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _speechToTextService = speechToTextService;
        _logger = logger;
    }

    [HttpPost("voice")]
    public async Task<ActionResult<ChatResponseDto>> SendVoiceMessage([FromForm] Microsoft.AspNetCore.Http.IFormFile audioFile)
    {
        if (audioFile == null || audioFile.Length == 0)
        {
            return BadRequest("Audio file is required.");
        }

        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Session is invalid. Please login again.");

            var sessionId = userIdString;
            _logger.LogInformation("Voice message received for user session: {SessionId}", sessionId);

            using var memoryStream = new System.IO.MemoryStream();
            await audioFile.CopyToAsync(memoryStream);
            memoryStream.Position = 0; // Reset position for reading

            // Convert speech to text
            var filename = audioFile.FileName ?? "voice.webm";
            var transcribedText = await _speechToTextService.TranscribeAudioAsync(memoryStream, filename);
            
            if (string.IsNullOrWhiteSpace(transcribedText))
            {
                return BadRequest("Could not transcribe the audio. Please try again.");
            }

            _logger.LogInformation("Transcribed text: {Text}", transcribedText);

            // Send transcribed text to chat service
            var reply = await _chatService.SendMessageAsync(sessionId, transcribedText);

            return Ok(new ChatResponseDto
            {
                Reply = reply,
                SessionId = sessionId,
                Timestamp = DateTime.UtcNow,
                TranscribedText = transcribedText // We'll add this to Dto so frontend can show what it heard
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process voice message.");
            return StatusCode(500, "Internal server error");
        }
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
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Session is invalid. Please login again.");

            var sessionId = userIdString; // Use the UserId as the SessionId
            _logger.LogInformation("Chat Message received for user session: {SessionId}", sessionId);

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
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Session is invalid. Please login again.");

            var targetSession = userIdString;
            _logger.LogInformation("Retrieving chat history for user session: {SessionId}", targetSession);

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
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Session is invalid. Please login again.");

            var targetSession = userIdString;
            _logger.LogInformation("Clearing chat history for user session: {SessionId}", targetSession);

            await _chatService.ClearHistoryAsync(targetSession);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear chat history.");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("upload")]
    public async Task<ActionResult<ChatResponseDto>> UploadDocument([FromForm] Microsoft.AspNetCore.Http.IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Session is invalid. Please login again.");

            var sessionId = userIdString;
            _logger.LogInformation("Document upload received: {FileName} ({Size} bytes) for session: {SessionId}", file.FileName, file.Length, sessionId);

            var extension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();
            string extractedText = string.Empty;

            if (extension == ".txt" || extension == ".md" || extension == ".json" || extension == ".csv")
            {
                using var reader = new System.IO.StreamReader(file.OpenReadStream());
                extractedText = await reader.ReadToEndAsync();
            }
            else if (extension == ".pdf")
            {
                var stringBuilder = new System.Text.StringBuilder();
                using (var memoryStream = new System.IO.MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;
                    using (var document = UglyToad.PdfPig.PdfDocument.Open(memoryStream))
                    {
                        foreach (var page in document.GetPages())
                        {
                            stringBuilder.AppendLine(page.Text);
                        }
                    }
                }
                extractedText = stringBuilder.ToString();
            }
            else
            {
                return BadRequest("Unsupported file format. Only PDF, TXT, MD, CSV, and JSON files are supported.");
            }

            if (extractedText.Length > 15000)
            {
                extractedText = extractedText.Substring(0, 15000) + "\n... [Document Truncated] ...";
            }

            // Construct prompt for the LLM
            var userPrompt = $"[Yüklenen Belge: {file.FileName}]\n\n{extractedText}\n\nLütfen bu belgeyi analiz et ve özetle.";
            
            // Send to chat service
            var reply = await _chatService.SendMessageAsync(sessionId, userPrompt);

            return Ok(new ChatResponseDto
            {
                Reply = reply,
                SessionId = sessionId,
                Timestamp = DateTime.UtcNow,
                TranscribedText = $"[Dosya Yüklendi: {file.FileName}]"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload and process document.");
            return StatusCode(500, $"Internal server error: {ex.Message}");
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
    public string? TranscribedText { get; set; }
}
