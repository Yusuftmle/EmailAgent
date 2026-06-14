using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using HtmlAgilityPack;
using EmailAgent.Core.Interfaces;
using EmailAgent.Core.Entities;
using System.Text.Json;
using System.Linq;
using EmailAgent.Infrastructure.Scraping.Interfaces;

namespace EmailAgent.Infrastructure.Scraping.Strategies;

public class GenericStrategy : PlaywrightStrategyBase
{
    private readonly EmailAgent.Agent.UniversalScraperAgent _universalScraperAgent;
    private readonly IScraperConfig _config;

    public GenericStrategy(
        IBrowserProvider browserProvider, 
        ILogger<GenericStrategy> logger, 
        EmailAgent.Agent.UniversalScraperAgent universalScraperAgent,
        IScraperConfig config) 
        : base(browserProvider, logger)
    {
        _universalScraperAgent = universalScraperAgent;
        _config = config;
    }

    public override bool CanHandle(string url)
    {
        // This is the fallback strategy, so it can handle anything
        return true;
    }

    public override async Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ParseProductAsync(string url, string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        decimal? price = null;
        string? currency = null;
        string? title = null;
        string? imageUrl = null;
        bool isInStock = true;

        // Try to get og:image as default for GenericStrategy
        var ogImage = doc.DocumentNode.SelectSingleNode("//meta[@property='og:image']");
        if (ogImage != null)
        {
            imageUrl = ogImage.GetAttributeValue("content", null);
        }

        // 1. Try ld+json schema
        var scripts = doc.DocumentNode.SelectNodes("//script[@type='application/ld+json']");
        if (scripts != null)
        {
            foreach (var script in scripts)
            {
                try
                {
                    using var jsonDoc = JsonDocument.Parse(script.InnerText);
                    var root = jsonDoc.RootElement;
                    
                    if (root.TryGetProperty("@type", out var typeProp) && typeProp.GetString() == "Product")
                    {
                        if (root.TryGetProperty("name", out var nameProp)) title = nameProp.GetString();
                        
                        if (root.TryGetProperty("offers", out var offers))
                        {
                            if (offers.TryGetProperty("price", out var priceProp))
                            {
                                if (decimal.TryParse(priceProp.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var p))
                                {
                                    price = p;
                                }
                            }
                            if (offers.TryGetProperty("priceCurrency", out var currProp)) currency = currProp.GetString();
                            if (offers.TryGetProperty("availability", out var availProp))
                            {
                                isInStock = availProp.GetString()?.Contains("InStock") ?? true;
                            }
                        }
                    }
                }
                catch { }
            }
        }

        // 2. Try OpenGraph price tags
        if (!price.HasValue)
        {
            var ogPrice = doc.DocumentNode.SelectSingleNode("//meta[@property='product:price:amount']");
            var ogCurrency = doc.DocumentNode.SelectSingleNode("//meta[@property='product:price:currency']");

            if (ogPrice != null)
            {
                var pStr = ogPrice.GetAttributeValue("content", "");
                if (decimal.TryParse(pStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var p))
                {
                    price = p;
                    currency = ogCurrency?.GetAttributeValue("content", "TL");
                }
            }
        }

        // 3. Fallback to AI (UniversalScraperAgent) if DOM parsing failed
        if (!price.HasValue)
        {
            _logger.LogInformation("DOM Parsing failed for {Url}. Falling back to UniversalScraperAgent (AI Extraction).", url);
            
            // Clean HTML for AI to save tokens
            var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//svg|//nav|//footer|//header|//iframe|//noscript");
            if (nodesToRemove != null)
            {
                foreach (var node in nodesToRemove) node.Remove();
            }
            var minifiedHtml = Regex.Replace(doc.DocumentNode.InnerHtml, @"\s+", " ").Trim();

            // Create a dummy user preferences to pass to the agent
            var dummyUser = new UserPreferences { Id = Guid.NewGuid(), Name = "System" };
            var aiDeals = await _universalScraperAgent.ExtractDealsAsync(dummyUser, minifiedHtml, url);
            
            if (aiDeals != null && aiDeals.Any())
            {
                var deal = aiDeals.First();
                price = deal.CurrentPrice;
                title = deal.Title;
                currency = "TL"; // Default assumption for AI response currently
            }
        }

        return (price, currency, title ?? "Unknown Product", imageUrl, isInStock);
    }

    public override async Task<List<CategoryDeal>> ParseCategoryDealsAsync(string categoryUrl, string html, decimal minDiscount)
    {
        var deals = new List<CategoryDeal>();
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        _logger.LogInformation("Category parsing for GenericStrategy uses UniversalScraperAgent.");

        // Clean HTML to save tokens
        var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//svg|//nav|//footer|//header|//iframe|//noscript");
        if (nodesToRemove != null)
        {
            foreach (var node in nodesToRemove) node.Remove();
        }
        var minifiedHtml = Regex.Replace(doc.DocumentNode.InnerHtml, @"\s+", " ").Trim();

        var dummyUser = new UserPreferences { Id = Guid.NewGuid(), Name = "System" };
        var aiDeals = await _universalScraperAgent.ExtractDealsAsync(dummyUser, minifiedHtml, categoryUrl);
        
        foreach (var deal in aiDeals)
        {
            if (deal.DiscountPercentage >= minDiscount)
            {
                deals.Add(deal);
            }
        }

        return deals;
    }
}
