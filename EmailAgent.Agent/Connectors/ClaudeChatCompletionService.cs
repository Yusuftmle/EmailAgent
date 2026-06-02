using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace EmailAgent.Agent.Connectors;

public class ClaudeChatCompletionService : IChatCompletionService
{
    private readonly string _defaultModel;
    private readonly string _defaultApiKey;
    private readonly string _provider;
    private readonly HttpClient _httpClient;
    private readonly IServiceProvider? _serviceProvider;

    public ClaudeChatCompletionService(string provider, string model, string apiKey, HttpClient? httpClient = null, IServiceProvider? serviceProvider = null)
    {
        _provider = string.IsNullOrEmpty(provider) ? "Claude" : provider;
        _defaultModel = string.IsNullOrEmpty(model) ? "claude-sonnet-4-5" : model;
        _defaultApiKey = apiKey ?? string.Empty;
        _httpClient = httpClient ?? new HttpClient();
        _serviceProvider = serviceProvider;
    }

    public IReadOnlyDictionary<string, object?> Attributes => new Dictionary<string, object?>();

    public async Task<IReadOnlyList<ChatMessageContent>> GetChatMessageContentsAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        PromptExecutionSettings? executionSettings = null,
        Kernel? kernel = null,
        CancellationToken cancellationToken = default)
    {
        string activeProvider = _provider;
        string activeApiKey = _defaultApiKey;
        string activeModel = _defaultModel;

        // 1. Resolve Active LLM Settings dynamically from configuration/database
        // The orchestrator already provides the specific Model and API Key to the constructor, so we just use them!

        string textContent = string.Empty;

        // 2. Dispatch LLM Request based on Selected Provider
        if (activeProvider == "Gemini")
        {
            textContent = await CallGeminiApiAsync(chatHistory, activeApiKey, activeModel, cancellationToken);
        }
        else if (activeProvider == "OpenAI")
        {
            textContent = await CallOpenAiApiAsync(chatHistory, activeApiKey, activeModel, cancellationToken);
        }
        else if (activeProvider == "Groq")
        {
            textContent = await CallGroqApiAsync(chatHistory, activeApiKey, activeModel, cancellationToken);
        }
        else if (activeProvider == "OpenRouter")
        {
            textContent = await CallOpenRouterApiAsync(chatHistory, activeApiKey, activeModel, cancellationToken);
        }
        else
        {
            // Default: Claude / Anthropic
            textContent = await CallClaudeApiAsync(chatHistory, activeApiKey, activeModel, cancellationToken);
        }

        return new List<ChatMessageContent>
        {
            new ChatMessageContent(AuthorRole.Assistant, textContent)
        }.AsReadOnly();
    }

    private async Task<string> CallClaudeApiAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        string apiKey,
        string model,
        CancellationToken cancellationToken)
    {
        var messages = new List<ClaudeMessage>();
        string? systemPrompt = null;

        foreach (var message in chatHistory)
        {
            if (message.Role == AuthorRole.System)
            {
                systemPrompt = message.Content;
            }
            else
            {
                var role = message.Role == AuthorRole.User ? "user" : "assistant";
                messages.Add(new ClaudeMessage
                {
                    Role = role,
                    Content = message.Content ?? string.Empty
                });
            }
        }

        var requestBody = new ClaudeRequest
        {
            Model = model,
            MaxTokens = 4000,
            System = systemPrompt,
            Messages = messages
        };

        var requestJson = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var claudeResponse = JsonSerializer.Deserialize<ClaudeResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return claudeResponse?.Content?[0]?.Text ?? string.Empty;
    }

    private async Task<string> CallOpenAiApiAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        string apiKey,
        string model,
        CancellationToken cancellationToken)
    {
        var messages = new List<OpenAiMessage>();

        foreach (var message in chatHistory)
        {
            string role = "user";
            if (message.Role == AuthorRole.System) role = "system";
            else if (message.Role == AuthorRole.Assistant) role = "assistant";

            messages.Add(new OpenAiMessage { Role = role, Content = message.Content ?? string.Empty });
        }

        var requestBody = new OpenAiRequest
        {
            Model = model,
            Messages = messages
        };

        var requestJson = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return openAiResponse?.Choices?[0]?.Message?.Content ?? string.Empty;
    }

    private async Task<string> CallGroqApiAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        string apiKey,
        string model,
        CancellationToken cancellationToken)
    {
        var messages = new List<OpenAiMessage>();

        foreach (var message in chatHistory)
        {
            string role = "user";
            if (message.Role == AuthorRole.System) role = "system";
            else if (message.Role == AuthorRole.Assistant) role = "assistant";

            messages.Add(new OpenAiMessage { Role = role, Content = message.Content ?? string.Empty });
        }

        var requestBody = new OpenAiRequest
        {
            Model = model,
            Messages = messages
        };

        var requestJson = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Groq API error (Status {response.StatusCode}): {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return openAiResponse?.Choices?[0]?.Message?.Content ?? string.Empty;
    }

    private async Task<string> CallOpenRouterApiAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        string apiKey,
        string model,
        CancellationToken cancellationToken)
    {
        var messages = new List<OpenAiMessage>();

        foreach (var message in chatHistory)
        {
            string role = "user";
            if (message.Role == AuthorRole.System) role = "system";
            else if (message.Role == AuthorRole.Assistant) role = "assistant";

            messages.Add(new OpenAiMessage { Role = role, Content = message.Content ?? string.Empty });
        }

        var requestBody = new OpenAiRequest
        {
            Model = model,
            Messages = messages
        };

        var requestJson = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Headers.Add("HTTP-Referer", "http://localhost:5209");
        request.Headers.Add("X-Title", "EmailAgent");
        request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"OpenRouter API error (Status {response.StatusCode}): {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return openAiResponse?.Choices?[0]?.Message?.Content ?? string.Empty;
    }

    private async Task<string> CallGeminiApiAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        string apiKey,
        string model,
        CancellationToken cancellationToken)
    {
        var contents = new List<GeminiContent>();
        GeminiSystemInstruction? systemInstruction = null;

        foreach (var message in chatHistory)
        {
            if (message.Role == AuthorRole.System)
            {
                systemInstruction = new GeminiSystemInstruction
                {
                    Parts = new List<GeminiPart> { new GeminiPart { Text = message.Content ?? string.Empty } }
                };
            }
            else
            {
                string role = message.Role == AuthorRole.User ? "user" : "model";
                contents.Add(new GeminiContent
                {
                    Role = role,
                    Parts = new List<GeminiPart> { new GeminiPart { Text = message.Content ?? string.Empty } }
                });
            }
        }

        var requestBody = new GeminiRequest
        {
            Contents = contents,
            SystemInstruction = systemInstruction
        };

        var requestJson = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
        
        int maxRetries = 4;
        int initialDelayMs = 10000; // 10 seconds initial delay

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("x-goog-api-key", apiKey.Trim());
            request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(responseJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return geminiResponse?.Candidates?[0]?.Content?.Parts?[0]?.Text ?? string.Empty;
            }

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests && attempt < maxRetries)
            {
                int delayMs = initialDelayMs * attempt;
                _serviceProvider?.GetService<Microsoft.Extensions.Logging.ILogger<ClaudeChatCompletionService>>()?
                    .LogWarning("Gemini API returned 429 (TooManyRequests). Retrying in {DelayMs}ms (Attempt {Attempt}/{MaxRetries}).", delayMs, attempt, maxRetries);
                await Task.Delay(delayMs, cancellationToken);
                continue;
            }

            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Gemini API error (Status {response.StatusCode}): {errorContent}");
        }

        throw new HttpRequestException("Gemini API call failed after multiple retries due to rate limits.");
    }

    public async IAsyncEnumerable<StreamingChatMessageContent> GetStreamingChatMessageContentsAsync(
        Microsoft.SemanticKernel.ChatCompletion.ChatHistory chatHistory,
        PromptExecutionSettings? executionSettings = null,
        Kernel? kernel = null,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var contents = await GetChatMessageContentsAsync(chatHistory, executionSettings, kernel, cancellationToken);
        foreach (var content in contents)
        {
            yield return new StreamingChatMessageContent(AuthorRole.Assistant, content.Content);
        }
    }

    #region Models Mapping DTOs
    // Claude DTOs
    private class ClaudeRequest
    {
        public string Model { get; set; } = string.Empty;
        public int MaxTokens { get; set; }
        public string? System { get; set; }
        public List<ClaudeMessage> Messages { get; set; } = new();
    }

    private class ClaudeMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    private class ClaudeResponse
    {
        public List<ClaudeContentPart>? Content { get; set; }
    }

    private class ClaudeContentPart
    {
        public string Text { get; set; } = string.Empty;
    }

    // OpenAI DTOs
    private class OpenAiRequest
    {
        public string Model { get; set; } = string.Empty;
        public List<OpenAiMessage> Messages { get; set; } = new();
    }

    private class OpenAiMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    private class OpenAiResponse
    {
        public List<OpenAiChoice>? Choices { get; set; }
    }

    private class OpenAiChoice
    {
        public OpenAiMessage? Message { get; set; }
    }

    // Gemini DTOs
    private class GeminiRequest
    {
        public List<GeminiContent> Contents { get; set; } = new();

        [JsonPropertyName("system_instruction")]
        public GeminiSystemInstruction? SystemInstruction { get; set; }
    }

    private class GeminiContent
    {
        public string Role { get; set; } = string.Empty;
        public List<GeminiPart> Parts { get; set; } = new();
    }

    private class GeminiPart
    {
        public string Text { get; set; } = string.Empty;
    }

    private class GeminiSystemInstruction
    {
        public List<GeminiPart> Parts { get; set; } = new();
    }

    private class GeminiResponse
    {
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    private class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }
    #endregion
}

public static class ClaudeKernelBuilderExtensions
{
    public static IServiceCollection AddClaudeChatCompletion(
        this IServiceCollection services,
        string model,
        string apiKey,
        HttpClient? httpClient = null)
    {
        services.AddKeyedSingleton<IChatCompletionService>(null, (serviceProvider, serviceKey) =>
        {
            return new ClaudeChatCompletionService("Claude", model, apiKey, httpClient, serviceProvider);
        });
        return services;
    }
}
