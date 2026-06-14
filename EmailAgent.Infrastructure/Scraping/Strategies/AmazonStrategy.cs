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

public class AmazonStrategy : PlaywrightStrategyBase
{
    public AmazonStrategy(IBrowserProvider browserProvider, ILogger<AmazonStrategy> logger) 
        : base(browserProvider, logger)
    {
    }

    public override bool CanHandle(string url)
    {
        return url.Contains("amazon.");
    }

    public override async Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ParseProductAsync(string url, string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        decimal? price = null;
        string? currency = null;
        string? title = null;
        string? imageUrl = null;
        bool isInStock = true; // Assume in stock unless proven otherwise

        var imageNode = doc.DocumentNode.SelectSingleNode("//img[@id='landingImage']") ?? 
                        doc.DocumentNode.SelectSingleNode("//img[@id='imgBlkFront']") ??
                        doc.DocumentNode.SelectSingleNode("//meta[@property='og:image']");
        
        if (imageNode != null)
        {
            imageUrl = imageNode.GetAttributeValue("src", null) ?? imageNode.GetAttributeValue("content", null);
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
                catch { /* Ignore JSON parse errors */ }
            }
        }

        // 2. Try specific Amazon CSS Selectors if LD+JSON failed
        if (!price.HasValue)
        {
            var titleNode = doc.DocumentNode.SelectSingleNode("//span[@id='productTitle']");
            if (titleNode != null && string.IsNullOrEmpty(title))
            {
                title = titleNode.InnerText.Trim();
            }

            var priceContainer = doc.DocumentNode.SelectSingleNode("//div[@id='corePriceDisplay_desktop_feature_div']") ?? 
                                 doc.DocumentNode.SelectSingleNode("//div[@id='corePrice_feature_div']") ?? 
                                 doc.DocumentNode.SelectSingleNode("//div[@id='price']");
            
            var priceWholeNode = priceContainer?.SelectSingleNode(".//span[contains(@class, 'a-price-whole')]") 
                              ?? doc.DocumentNode.SelectSingleNode("//span[contains(@class, 'a-price-whole')]");
            var priceFractionNode = priceContainer?.SelectSingleNode(".//span[contains(@class, 'a-price-fraction')]") 
                                 ?? doc.DocumentNode.SelectSingleNode("//span[contains(@class, 'a-price-fraction')]");
            var symbolNode = priceContainer?.SelectSingleNode(".//span[contains(@class, 'a-price-symbol')]") 
                          ?? doc.DocumentNode.SelectSingleNode("//span[contains(@class, 'a-price-symbol')]");

            if (priceWholeNode != null)
            {
                var whole = Regex.Replace(priceWholeNode.InnerText, @"[^\d]", "");
                var fraction = priceFractionNode != null ? Regex.Replace(priceFractionNode.InnerText, @"[^\d]", "") : "00";
                
                if (decimal.TryParse($"{whole}.{fraction}", System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedPrice))
                {
                    price = parsedPrice;
                }

                if (symbolNode != null)
                {
                    var symbol = symbolNode.InnerText.Trim();
                    if (symbol.Contains("€")) currency = "EUR";
                    else if (symbol.Contains("$")) currency = "USD";
                    else if (symbol.Contains("TL") || symbol.Contains("₺")) currency = "TRY";
                }
            }
        }

        return await Task.FromResult((price, currency, title, imageUrl, isInStock));
    }

    public override async Task<List<CategoryDeal>> ParseCategoryDealsAsync(string categoryUrl, string html, decimal minDiscount)
    {
        var deals = new List<CategoryDeal>();
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var productNodes = doc.DocumentNode.SelectNodes("//div[@data-component-type='s-search-result']");
        if (productNodes == null) return deals;

        foreach (var node in productNodes)
        {
            try
            {
                var titleNode = node.SelectSingleNode(".//h2/a/span");
                var linkNode = node.SelectSingleNode(".//h2/a");
                if (titleNode == null || linkNode == null) continue;

                var title = titleNode.InnerText.Trim();
                var url = linkNode.GetAttributeValue("href", "");
                if (!url.StartsWith("http"))
                {
                    var uri = new Uri(categoryUrl);
                    url = $"{uri.Scheme}://{uri.Host}{url}";
                }

                var priceNodes = node.SelectNodes(".//span[@class='a-price']//span[@class='a-offscreen']");
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
            catch { }
        }

        return await Task.FromResult(deals);
    }

    private decimal ParsePrice(string priceStr)
    {
        try
        {
            var clean = Regex.Replace(priceStr, @"[^\d,\.]", "").Trim();
            if (clean.Contains(",") && clean.Contains(".")) clean = clean.Replace(".", "").Replace(",", ".");
            else if (clean.Contains(",")) clean = clean.Replace(",", ".");
            
            if (decimal.TryParse(clean, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal result))
            {
                return result;
            }
        }
        catch { }
        return 0;
    }
}
