using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Agent.Core;
using EmailAgent.Core.Entities;
using Microsoft.Extensions.Logging;

namespace EmailAgent.Agent;

public class UniversalScraperAgent
{
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;
    private readonly ILogger<UniversalScraperAgent> _logger;

    public UniversalScraperAgent(IServiceProvider serviceProvider, IHttpClientFactory httpClientFactory, Microsoft.Extensions.Configuration.IConfiguration config, ILogger<UniversalScraperAgent> logger)
    {
        _serviceProvider = serviceProvider;
        _httpClient = httpClientFactory.CreateClient("AIAgentClient");
        _config = config;
        _logger = logger;
    }

    public async Task<List<CategoryDeal>> ExtractDealsAsync(UserPreferences userPrefs, string minifiedHtml, string baseUrl)
    {
        var provider = string.IsNullOrEmpty(userPrefs.AiProvider) ? "Gemini" : userPrefs.AiProvider;
        var apiKey = string.IsNullOrWhiteSpace(userPrefs.ApiKey) ? _config[$"{provider}:ApiKey"] : userPrefs.ApiKey;

        var kernel = new AegisKernelBuilder(_serviceProvider)
            .UseModel(provider, "gemini-1.5-pro-latest", apiKey, _httpClient) // Use pro for larger context window
            .Build();

        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var chatHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();

        string systemPrompt = @"You are an expert web scraper and data extractor.
Your job is to read minified HTML from an e-commerce category/search page and extract all product deals.
Rules:
1. Extract the product Title.
2. Extract the absolute Product URL. If the URL is relative, prepend the given Base URL.
3. Extract the Current Price as a decimal number (e.g. 1299.99). Ignore currency symbols.
4. Extract the Original Price as a decimal number (if crossed out or explicitly marked as old price). If not found, output the same as CurrentPrice or 0.
5. Your response MUST be ONLY a raw JSON array of objects. Do not include markdown formatting like ```json or any other text.
JSON Schema:
[
  { ""Title"": ""string"", ""ProductUrl"": ""string"", ""CurrentPrice"": 1200.50, ""OriginalPrice"": 1500.00 }
]";

        chatHistory.AddSystemMessage(systemPrompt);

        string userPrompt = $"Base URL: {baseUrl}\n\nMinified HTML:\n{minifiedHtml}";
        chatHistory.AddUserMessage(userPrompt);

        try
        {
            _logger.LogInformation("UniversalScraperAgent: Yapay zekaya HTML gönderiliyor ve fiyat analizleri isteniyor. İçerik Boyutu: {Length} karakter.", minifiedHtml.Length);
            
            var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
            var content = response.Content?.Trim() ?? "";

            _logger.LogInformation("UniversalScraperAgent: AI JSON yanıtı döndürdü. Yanıt Boyutu: {Length} karakter.", content.Length);
            _logger.LogDebug("UniversalScraperAgent AI JSON Yanıtı: {Response}", content);

            // Remove markdown code blocks if the AI ignored the instruction
            if (content.StartsWith("```json")) content = content.Substring(7);
            if (content.StartsWith("```")) content = content.Substring(3);
            if (content.EndsWith("```")) content = content.Substring(0, content.Length - 3);
            content = content.Trim();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var deals = JsonSerializer.Deserialize<List<CategoryDeal>>(content, options);

            return deals ?? new List<CategoryDeal>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract deals via Universal Scraper Agent.");
            return new List<CategoryDeal>();
        }
    }
}
