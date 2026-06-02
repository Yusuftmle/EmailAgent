using System;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace EmailAgent.Infrastructure.Services;

public class ProductScraperService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductScraperService> _logger;

    public ProductScraperService(HttpClient httpClient, ILogger<ProductScraperService> logger)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        _logger = logger;
    }

    public async Task<(decimal? Price, string? Currency, string? Title)> ScrapeProductAsync(string url)
    {
        try
        {
            var html = await _httpClient.GetStringAsync(url);
            
            // Extract <script type="application/ld+json"> blocks
            var matches = Regex.Matches(html, @"<script\s+type=""application/ld\+json"">(.*?)</script>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            
            foreach (Match match in matches)
            {
                var jsonStr = match.Groups[1].Value;
                try
                {
                    using var doc = JsonDocument.Parse(jsonStr);
                    var root = doc.RootElement;
                    
                    // JSON-LD can be an array of objects or a single object
                    if (root.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in root.EnumerateArray())
                        {
                            var result = ExtractFromSchema(item);
                            if (result.Price.HasValue) return result;
                        }
                    }
                    else if (root.ValueKind == JsonValueKind.Object)
                    {
                        // Check if it's a @graph containing multiple objects
                        if (root.TryGetProperty("@graph", out var graph) && graph.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var item in graph.EnumerateArray())
                            {
                                var result = ExtractFromSchema(item);
                                if (result.Price.HasValue) return result;
                            }
                        }
                        else
                        {
                            var result = ExtractFromSchema(root);
                            if (result.Price.HasValue) return result;
                        }
                    }
                }
                catch (JsonException)
                {
                    // Ignore parsing errors for individual blocks
                }
            }

            _logger.LogWarning("Could not find Product Schema on {Url}", url);
            return (null, null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scraping URL: {Url}", url);
            return (null, null, null);
        }
    }

    private (decimal? Price, string? Currency, string? Title) ExtractFromSchema(JsonElement item)
    {
        if (item.TryGetProperty("@type", out var typeProp))
        {
            var type = typeProp.GetString();
            if (type == "Product")
            {
                string? title = item.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                
                if (item.TryGetProperty("offers", out var offers))
                {
                    // Offers can be a single object or array
                    if (offers.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var offer in offers.EnumerateArray())
                        {
                            if (ExtractPriceFromOffer(offer, out var price, out var currency))
                            {
                                return (price, currency, title);
                            }
                        }
                    }
                    else if (offers.ValueKind == JsonValueKind.Object)
                    {
                        if (ExtractPriceFromOffer(offers, out var price, out var currency))
                        {
                            return (price, currency, title);
                        }
                    }
                }
            }
        }
        return (null, null, null);
    }

    private bool ExtractPriceFromOffer(JsonElement offer, out decimal price, out string currency)
    {
        price = 0;
        currency = "EUR";

        if (offer.TryGetProperty("price", out var priceProp) && offer.TryGetProperty("priceCurrency", out var currencyProp))
        {
            currency = currencyProp.GetString() ?? "EUR";
            
            // Price can be string "199.99" or number 199.99
            if (priceProp.ValueKind == JsonValueKind.Number)
            {
                price = priceProp.GetDecimal();
                return true;
            }
            else if (priceProp.ValueKind == JsonValueKind.String)
            {
                if (decimal.TryParse(priceProp.GetString()?.Replace(",", "."), out price))
                {
                    return true;
                }
            }
        }
        return false;
    }
}
