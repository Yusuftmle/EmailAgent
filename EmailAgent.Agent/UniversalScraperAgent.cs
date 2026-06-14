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
using Microsoft.Extensions.Caching.Memory;
using System.Security.Cryptography;

namespace EmailAgent.Agent;

public class UniversalScraperAgent
{
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;
    private readonly ILogger<UniversalScraperAgent> _logger;
    private readonly IMemoryCache _cache;

    public UniversalScraperAgent(IServiceProvider serviceProvider, IHttpClientFactory httpClientFactory, Microsoft.Extensions.Configuration.IConfiguration config, ILogger<UniversalScraperAgent> logger, IMemoryCache cache)
    {
        _serviceProvider = serviceProvider;
        _httpClient = httpClientFactory.CreateClient("AIAgentClient");
        _config = config;
        _logger = logger;
        _cache = cache;
    }

    public async Task<List<CategoryDeal>> ExtractDealsAsync(UserPreferences userPrefs, string minifiedHtml, string baseUrl)
    {
        var provider = string.IsNullOrEmpty(userPrefs.AiProvider) ? "Gemini" : userPrefs.AiProvider;
        var apiKey = string.IsNullOrWhiteSpace(userPrefs.ApiKey) ? _config[$"{provider}:ApiKey"] : userPrefs.ApiKey;

        string modelId = provider switch
        {
            "Gemini" => "gemini-flash-latest",
            "OpenAI" => "gpt-4o-mini",
            "Groq" => "llama-3.3-70b-versatile",
            "OpenRouter" => "meta-llama/llama-3.1-8b-instruct",
            _ => "claude-3-5-sonnet-latest"
        };

        string cacheKey = ComputeHash(baseUrl + minifiedHtml);
        if (_cache.TryGetValue(cacheKey, out List<CategoryDeal>? cachedDeals) && cachedDeals != null)
        {
            _logger.LogInformation("UniversalScraperAgent: CACHE HIT! Döndürülen JSON, API'ye gidilmeden Cache'den alındı.");
            return cachedDeals;
        }

        var kernel = new AegisKernelBuilder(_serviceProvider)
            .UseModel(provider, modelId, apiKey, _httpClient)
            .Build();

        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var chatHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();

        string systemPrompt = @"Extract product deals from minified HTML.
Rules:
1. Title
2. Absolute ProductUrl (prepend Base URL if relative)
3. CurrentPrice (decimal, ignore currency)
4. OriginalPrice (decimal, 0 if none)
5. ImageUrl (Extract the PRIMARY product image URL from <img> or data-src tags. Ignore ads/icons)
6. Output ONLY raw JSON array. NO markdown.
Schema: [{""Title"":""str"",""ProductUrl"":""str"",""ImageUrl"":""str"",""CurrentPrice"":0.0,""OriginalPrice"":0.0}]";

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

            if (deals != null && deals.Count > 0)
            {
                _cache.Set(cacheKey, deals, TimeSpan.FromHours(1)); // Cache for 1 hour
            }

            return deals ?? new List<CategoryDeal>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract deals via Universal Scraper Agent.");
            return new List<CategoryDeal>();
        }
    }

    public async Task<List<CategoryDeal>> ExtractAndDeltaCheckAsync(UserPreferences userPrefs, string minifiedHtml, string baseUrl, Guid categoryId)
    {
        // 1. Scrape the raw deals
        var allDeals = await ExtractDealsAsync(userPrefs, minifiedHtml, baseUrl);
        
        if (allDeals.Count == 0) return allDeals;

        // 2. Perform Delta check with SeenListings
        using var scope = _serviceProvider.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<EmailAgent.Core.Repositories.ISeenListingsRepository>();

        var existingListings = await repo.GetSeenListingsAsync(userPrefs.Id, categoryId);
        var existingMap = existingListings.ToDictionary(x => x.ListingIdentifier);

        var deltaDeals = new List<CategoryDeal>();

        foreach (var deal in allDeals)
        {
            // We use ProductUrl as the unique identifier for the listing
            string identifier = deal.ProductUrl;
            if (string.IsNullOrWhiteSpace(identifier)) continue;

            bool isDelta = false;

            if (existingMap.TryGetValue(identifier, out var seen))
            {
                // Price Drop Check
                if (deal.CurrentPrice > 0 && deal.CurrentPrice < seen.LastSeenPrice)
                {
                    _logger.LogInformation("UniversalScraperAgent: Price Drop Detected for {Title}! {OldPrice} -> {NewPrice}", deal.Title, seen.LastSeenPrice, deal.CurrentPrice);
                    isDelta = true;
                    seen.LastSeenPrice = deal.CurrentPrice;
                    seen.LastSeenAt = DateTime.UtcNow;
                    await repo.UpsertSeenListingAsync(seen);
                }
            }
            else
            {
                // Brand new listing
                isDelta = true;
                var newSeen = new SeenListing
                {
                    Id = Guid.NewGuid(),
                    UserId = userPrefs.Id,
                    CategoryId = categoryId,
                    ListingIdentifier = identifier,
                    LastSeenPrice = deal.CurrentPrice,
                    FirstSeenAt = DateTime.UtcNow,
                    LastSeenAt = DateTime.UtcNow
                };
                await repo.UpsertSeenListingAsync(newSeen);
            }

            if (isDelta)
            {
                deltaDeals.Add(deal);
            }
        }

        _logger.LogInformation("UniversalScraperAgent: Delta kontrolü tamamlandı. Toplam İlan: {Total}, Yeni veya Düşen Fiyatlı İlan: {Delta}", allDeals.Count, deltaDeals.Count);
        
        return deltaDeals;
    }

    public async Task<SiteStrategyDefinition?> DiscoverSelectorsAsync(UserPreferences userPrefs, string minifiedHtml, string domain)
    {
        var provider = string.IsNullOrEmpty(userPrefs.AiProvider) ? "Gemini" : userPrefs.AiProvider;
        var apiKey = string.IsNullOrWhiteSpace(userPrefs.ApiKey) ? _config[$"{provider}:ApiKey"] : userPrefs.ApiKey;

        string modelId = provider switch
        {
            "Gemini" => "gemini-flash-latest",
            "OpenAI" => "gpt-4o-mini",
            "Groq" => "llama-3.3-70b-versatile",
            "OpenRouter" => "meta-llama/llama-3.1-8b-instruct",
            _ => "claude-3-5-sonnet-latest"
        };

        var kernel = new AegisKernelBuilder(_serviceProvider)
            .UseModel(provider, modelId, apiKey, _httpClient)
            .Build();

        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var chatHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();

        string systemPrompt = @"You are an expert HTML analyst and scraper.
Given the minified HTML of a product page, your goal is to find the most accurate CSS selectors for the product's Title, Price, Stock Status, and Image.
Rules:
1. Return ONLY a JSON object. No markdown, no explanations.
2. The JSON schema must be: { ""PriceSelector"": ""string"", ""TitleSelector"": ""string"", ""StockSelector"": ""string"", ""ImageSelector"": ""string"" }
3. Find the CSS selector for the main product image (e.g., car photo). Do NOT select generic site logos, headers, or banners. Prefer selectors like `.gallery-picture`, `.main-product-image`, `img[itemprop='image']`. If not found, fallback to `meta[property='og:image']`.
4. The selectors must be valid CSS selectors that can be used with document.querySelector.
5. If you cannot find a selector for a field, leave it empty. Ensure high confidence.";

        chatHistory.AddSystemMessage(systemPrompt);
        chatHistory.AddUserMessage($"Domain: {domain}\n\nHTML:\n{minifiedHtml}");

        try
        {
            var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
            var content = response.Content?.Trim() ?? "";

            if (content.StartsWith("```json")) content = content.Substring(7);
            if (content.StartsWith("```")) content = content.Substring(3);
            if (content.EndsWith("```")) content = content.Substring(0, content.Length - 3);
            content = content.Trim();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var discovered = JsonSerializer.Deserialize<SiteStrategyDefinition>(content, options);
            
            if (discovered != null)
            {
                discovered.Domain = domain;
                discovered.FetchMethod = "Playwright";
                discovered.Confidence = 0.9;
                discovered.LastVerifiedAt = DateTimeOffset.UtcNow;
                return discovered;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover selectors via Universal Scraper Agent.");
        }

        return null;
    }

    private string ComputeHash(string rawData)
    {
        using (SHA256 sha256Hash = SHA256.Create())
        {
            byte[] bytes = sha256Hash.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawData));
            System.Text.StringBuilder builder = new System.Text.StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }
    }
}
