using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using HtmlAgilityPack;
using EmailAgent.Core.Interfaces;
using EmailAgent.Core.Entities;
using System.Text.Json;

namespace EmailAgent.Infrastructure.Scraping.Strategies;

public class SahibindenStrategy : ISiteStrategy
{
    private readonly IScraperConfig _config;
    private readonly ILogger<SahibindenStrategy> _logger;

    public SahibindenStrategy(IScraperConfig config, ILogger<SahibindenStrategy> logger)
    {
        _config = config;
        _logger = logger;
    }

    public bool CanHandle(string url)
    {
        return url.Contains("sahibinden.com");
    }

    public async Task<string> FetchHtmlAsync(string url)
    {
        _logger.LogInformation("Using ScraperAPI REST endpoint directly to bypass Cloudflare Turnstile for Sahibinden...");
        using var httpClient = new HttpClient();
        httpClient.Timeout = TimeSpan.FromSeconds(70);
        
        var encodedUrl = Uri.EscapeDataString(url);
        // Scraper API password usually contains the API key
        var apiKey = _config.ScraperApiProxyPassword; 
        
        var apiUrl = $"http://api.scraperapi.com?api_key={apiKey}&url={encodedUrl}&render=true&country_code=tr&premium=true";
        
        try
        {
            var responseHtml = await httpClient.GetStringAsync(apiUrl);
            _logger.LogInformation("Successfully fetched HTML via ScraperAPI REST endpoint. Length: {Length}", responseHtml.Length);
            return responseHtml;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ScraperAPI REST endpoint failed for Sahibinden.");
            throw; // If ScraperAPI fails, we fail the fetch
        }
    }

    public async Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ParseProductAsync(string url, string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        decimal? price = null;
        string? currency = null;
        string? title = null;
        string? imageUrl = null;
        bool isInStock = true;

        var imageNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'megaPhoto')]//img") ??
                        doc.DocumentNode.SelectSingleNode("//meta[@property='og:image']");
        if (imageNode != null)
        {
            imageUrl = imageNode.GetAttributeValue("src", null) ?? imageNode.GetAttributeValue("content", null);
        }

        var titleNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'classifiedDetailTitle')]//h1");
        if (titleNode != null) title = titleNode.InnerText.Trim();

        var priceNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'classifiedInfo')]//h3");
        if (priceNode != null)
        {
            var priceText = priceNode.InnerText.Trim();
            var cleanPrice = Regex.Replace(priceText, @"[^\d]", "");
            if (decimal.TryParse(cleanPrice, out var p))
            {
                price = p;
                currency = priceText.Contains("TL") ? "TL" : "TL"; // Default to TL
            }
        }

        // Login Redirect Check
        if (string.IsNullOrEmpty(title) || title.ToLower().Contains("giriş"))
        {
            _logger.LogWarning("Detected redirection to login/WAF wall on {Url}. Retrying via Serper search...", url);
            var serperResult = await ScrapeViaSerperAsync(url);
            if (serperResult.Price.HasValue) return serperResult;
        }

        if (!price.HasValue && string.IsNullOrEmpty(title))
        {
            // Fallback to serper if the whole page is blocked or missing price
            var serperResult = await ScrapeViaSerperAsync(url);
            if (serperResult.Price.HasValue) return serperResult;
        }

        return (price, currency, title ?? "Unknown Product", imageUrl, isInStock);
    }

    public Task<List<CategoryDeal>> ParseCategoryDealsAsync(string categoryUrl, string html, decimal minDiscount)
    {
        // Category scraping for Sahibinden is not fully implemented yet in the original code,
        // but we return empty list to fulfill the interface
        return Task.FromResult(new List<CategoryDeal>());
    }

    private async Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ScrapeViaSerperAsync(string targetUrl)
    {
        try
        {
            var match = Regex.Match(targetUrl, @"-(\d+)$");
            if (!match.Success) return (null, null, null, null, false);
            string listingId = match.Groups[1].Value;

            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("X-API-KEY", _config.SerperApiKey);
            httpClient.DefaultRequestHeaders.Add("Content-Type", "application/json");

            var payload = new { q = $"site:sahibinden.com {listingId}", gl = "tr", hl = "tr" };
            var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            
            var response = await httpClient.PostAsync("https://google.serper.dev/search", content);
            if (!response.IsSuccessStatusCode) return (null, null, null, null, false);

            var jsonString = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(jsonString);
            
            if (jsonDoc.RootElement.TryGetProperty("organic", out var organicElement) && organicElement.GetArrayLength() > 0)
            {
                var firstResult = organicElement[0];
                string? snippet = firstResult.TryGetProperty("snippet", out var sProp) ? sProp.GetString() : null;
                string? title = firstResult.TryGetProperty("title", out var tProp) ? tProp.GetString() : null;
                
                if (!string.IsNullOrEmpty(snippet))
                {
                    var priceMatch = Regex.Match(snippet, @"([\d\.,]+)\s*(TL|TRY)", RegexOptions.IgnoreCase);
                    if (priceMatch.Success)
                    {
                        var cleanPriceStr = priceMatch.Groups[1].Value.Replace(".", "").Replace(",", ".");
                        if (decimal.TryParse(cleanPriceStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var price))
                        {
                            return (price, "TL", title, null, true);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Serper fallback failed.");
        }
        
        return (null, null, null, null, false);
    }
}
