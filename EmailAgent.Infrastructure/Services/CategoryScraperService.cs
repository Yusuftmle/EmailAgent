using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;

using EmailAgent.Core.Entities;

namespace EmailAgent.Infrastructure.Services;

public class CategoryScraperService
{
    private readonly PlaywrightScraperService _playwrightScraper;
    private readonly EmailAgent.Agent.UniversalScraperAgent _universalScraperAgent;
    private readonly ILogger<CategoryScraperService> _logger;

    public CategoryScraperService(PlaywrightScraperService playwrightScraper, EmailAgent.Agent.UniversalScraperAgent universalScraperAgent, ILogger<CategoryScraperService> logger)
    {
        _playwrightScraper = playwrightScraper;
        _universalScraperAgent = universalScraperAgent;
        _logger = logger;
    }

    public async Task<List<CategoryDeal>> FindDealsInCategoryAsync(EmailAgent.Core.Entities.UserPreferences userPrefs, string categoryUrl, decimal minDiscount)
    {
        var deals = new List<CategoryDeal>();
        try
        {
            var html = await _playwrightScraper.GetHtmlAsync(categoryUrl);
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // HYBRID LOGIC: If it's not Amazon, delegate to AI
            if (!categoryUrl.ToLower().Contains("amazon."))
            {
                // Minify HTML to save tokens
                var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//svg|//nav|//footer|//header|//iframe|//noscript");
                if (nodesToRemove != null)
                {
                    foreach (var node in nodesToRemove)
                    {
                        node.Remove();
                    }
                }
                var minifiedHtml = doc.DocumentNode.InnerText; // Just raw text is often enough for the AI, but let's pass InnerHtml to keep links
                minifiedHtml = doc.DocumentNode.InnerHtml;
                // Basic compression
                minifiedHtml = System.Text.RegularExpressions.Regex.Replace(minifiedHtml, @"\s+", " ").Trim();

                var uri = new Uri(categoryUrl);
                var baseUrl = $"{uri.Scheme}://{uri.Host}";

                var aiDeals = await _universalScraperAgent.ExtractDealsAsync(userPrefs, minifiedHtml, baseUrl);
                
                // Filter by minDiscount
                foreach (var deal in aiDeals)
                {
                    if (deal.DiscountPercentage >= minDiscount)
                    {
                        deals.Add(deal);
                    }
                }
                return deals;
            }

            // Amazon search results typically have data-component-type="s-search-result"
            var productNodes = doc.DocumentNode.SelectNodes("//div[@data-component-type='s-search-result']");
            if (productNodes == null)
            {
                _logger.LogWarning("No products found on category page: {Url}", categoryUrl);
                return deals;
            }

            foreach (var node in productNodes)
            {
                try
                {
                    // Extract Title and URL
                    var titleNode = node.SelectSingleNode(".//h2/a/span");
                    var linkNode = node.SelectSingleNode(".//h2/a");
                    if (titleNode == null || linkNode == null) continue;

                    var title = titleNode.InnerText.Trim();
                    var url = linkNode.GetAttributeValue("href", "");
                    if (!url.StartsWith("http")) 
                    {
                        var uri = new Uri(categoryUrl);
                        var baseUrl = $"{uri.Scheme}://{uri.Host}";
                        url = baseUrl + url;
                    }

                    // Extract Prices
                    // Current price is usually inside a span with class 'a-price' -> 'a-offscreen'
                    var priceNodes = node.SelectNodes(".//span[@class='a-price']//span[@class='a-offscreen']");
                    
                    // If there's an original price, there's usually a second a-price node with class a-text-price
                    var originalPriceNode = node.SelectSingleNode(".//span[@class='a-price a-text-price']//span[@class='a-offscreen']");
                    
                    if (priceNodes != null && priceNodes.Count > 0 && originalPriceNode != null)
                    {
                        var currentPriceStr = priceNodes[0].InnerText;
                        var originalPriceStr = originalPriceNode.InnerText;

                        var currentPrice = ParsePrice(currentPriceStr);
                        var originalPrice = ParsePrice(originalPriceStr);

                        if (currentPrice > 0 && originalPrice > currentPrice)
                        {
                            var deal = new CategoryDeal
                            {
                                Title = title,
                                ProductUrl = url,
                                CurrentPrice = currentPrice,
                                OriginalPrice = originalPrice
                            };

                            if (deal.DiscountPercentage >= minDiscount)
                            {
                                deals.Add(deal);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to parse a product node in category search.");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch or parse category page: {Url}", categoryUrl);
        }

        return deals;
    }

    private decimal ParsePrice(string priceStr)
    {
        try
        {
            // Remove currency symbols (Euro, $, £) and fix commas
            var clean = Regex.Replace(priceStr, @"[^\d,\.]", "").Trim();
            // In Europe, comma is decimal separator (e.g. 1.200,99). We standardise it.
            if (clean.Contains(",") && clean.Contains("."))
            {
                // Format like 1.200,99
                clean = clean.Replace(".", "").Replace(",", ".");
            }
            else if (clean.Contains(","))
            {
                // Format like 1200,99
                clean = clean.Replace(",", ".");
            }
            
            if (decimal.TryParse(clean, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal result))
            {
                return result;
            }
        }
        catch { }
        return 0;
    }
}
