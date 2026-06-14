using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Interfaces;
using EmailAgent.Core.Entities;
using EmailAgent.Infrastructure.Scraping.Interfaces;
using HtmlAgilityPack;
using HtmlAgilityPack.CssSelectors.NetCore;

namespace EmailAgent.Infrastructure.Scraping.Strategies;

public class DynamicDatabaseStrategy : PlaywrightStrategyBase
{
    private readonly IStrategyDefinitionRepository _repository;
    private SiteStrategyDefinition? _currentDefinition;

    public DynamicDatabaseStrategy(
        IStrategyDefinitionRepository repository,
        IBrowserProvider browserProvider,
        ILogger<DynamicDatabaseStrategy> logger) : base(browserProvider, logger)
    {
        _repository = repository;
    }

    public override bool CanHandle(string url)
    {
        try
        {
            var uri = new Uri(url);
            var definition = _repository.GetByDomainAsync(uri.Host).GetAwaiter().GetResult();
            
            if (definition != null && definition.Confidence >= 0.4)
            {
                _currentDefinition = definition;
                return true;
            }
            
            return false;
        }
        catch
        {
            return false;
        }
    }

    public override async Task<string> FetchHtmlAsync(string url)
    {
        if (_currentDefinition?.FetchMethod == "Playwright")
        {
            return await base.FetchHtmlAsync(url);
        }
        
        // Fallback for ScraperAPI or others if implemented
        return await base.FetchHtmlAsync(url);
    }

    public override async Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ParseProductAsync(string url, string html)
    {
        decimal? price = null;
        string? currency = null;
        string? title = null;
        string? imageUrl = null;
        bool isInStock = true;
        
        if (_currentDefinition == null) return (price, currency, title, imageUrl, isInStock);

        try
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Parse Price
            if (!string.IsNullOrEmpty(_currentDefinition.PriceSelector))
            {
                var priceNode = doc.DocumentNode.QuerySelector(_currentDefinition.PriceSelector);
                
                if (priceNode != null)
                {
                    var priceText = priceNode.InnerText.Trim();
                    if (decimal.TryParse(System.Text.RegularExpressions.Regex.Replace(priceText, @"[^\d.,]", ""), out var p))
                    {
                        price = p;
                        currency = priceText.Contains("€") ? "EUR" : priceText.Contains("$") ? "USD" : "TRY";
                    }
                }
            }

            // Confidence Tracking: If we failed to parse the price, reduce confidence
            if (price == null || price == 0)
            {
                _logger.LogWarning("Failed to parse price for {Url} using DB Strategy. Reducing confidence.", url);
                _currentDefinition.Confidence -= 0.2;
                await _repository.UpdateAsync(_currentDefinition);
            }
            else if (_currentDefinition.Confidence < 1.0)
            {
                // Slightly recover confidence on success
                _currentDefinition.Confidence = Math.Min(1.0, _currentDefinition.Confidence + 0.1);
                _currentDefinition.LastVerifiedAt = DateTimeOffset.UtcNow;
                await _repository.UpdateAsync(_currentDefinition);
            }

            // Parse Title
            if (!string.IsNullOrEmpty(_currentDefinition.TitleSelector))
            {
                var titleNode = doc.DocumentNode.QuerySelector(_currentDefinition.TitleSelector);
                if (titleNode != null)
                {
                    title = titleNode.InnerText.Trim();
                }
            }

            // Parse Image
            if (!string.IsNullOrEmpty(_currentDefinition.ImageSelector))
            {
                var imageNode = doc.DocumentNode.QuerySelector(_currentDefinition.ImageSelector);
                if (imageNode != null)
                {
                    imageUrl = imageNode.GetAttributeValue("src", null) ?? imageNode.GetAttributeValue("data-src", null);
                }
            }
            
            if (string.IsNullOrEmpty(imageUrl))
            {
                var ogImage = doc.DocumentNode.SelectSingleNode("//meta[@property='og:image']");
                if (ogImage != null)
                {
                    imageUrl = ogImage.GetAttributeValue("content", null);
                }
            }

            isInStock = true; // Simplified for now, or use StockSelector
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing product with DynamicDatabaseStrategy for {Url}", url);
        }

        return (price, currency, title, imageUrl, isInStock);
    }

    public override async Task<System.Collections.Generic.List<CategoryDeal>> ParseCategoryDealsAsync(string categoryUrl, string html, decimal minDiscount)
    {
        return new System.Collections.Generic.List<CategoryDeal>();
    }
}
