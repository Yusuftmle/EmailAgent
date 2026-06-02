using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EmailAgent.Infrastructure.Services;

public interface ISpeechToTextService
{
    Task<string> TranscribeAudioAsync(Stream audioStream, string filename, CancellationToken cancellationToken = default);
}

public class GroqSpeechToTextService : ISpeechToTextService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GroqSpeechToTextService> _logger;

    public GroqSpeechToTextService(HttpClient httpClient, IConfiguration configuration, ILogger<GroqSpeechToTextService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream, string filename, CancellationToken cancellationToken = default)
    {
        try
        {
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Groq API Key is not configured. Cannot transcribe audio.");
                return string.Empty;
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/audio/transcriptions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var content = new MultipartFormDataContent();
            
            // Add the audio stream
            var streamContent = new StreamContent(audioStream);
            // Telegram usually sends OGG with Opus codec for voice messages.
            streamContent.Headers.ContentType = new MediaTypeHeaderValue("audio/ogg"); 
            content.Add(streamContent, "file", filename);

            // Add model and response format
            content.Add(new StringContent("whisper-large-v3-turbo"), "model");
            content.Add(new StringContent("text"), "response_format");
            content.Add(new StringContent("tr"), "language"); // Optimize for Turkish as requested by the user

            request.Content = content;

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq Whisper API failed with status {Status}: {Response}", response.StatusCode, responseContent);
                return string.Empty;
            }

            // When response_format is "text", the API returns the raw transcribed string directly.
            return responseContent.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred during speech-to-text transcription.");
            return string.Empty;
        }
    }
}
