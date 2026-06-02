using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;

namespace EmailAgent.Infrastructure.Services;

public class CategoryDeal
{
    public string Title { get; set; } = string.Empty;
    public string ProductUrl { get; set; } = string.Empty;
    public decimal OriginalPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal DiscountPercentage => OriginalPrice > 0 ? ((OriginalPrice - CurrentPrice) / OriginalPrice) * 100 : 0;
}

public class CategoryScraperService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CategoryScraperService> _logger;

    public CategoryScraperService(IHttpClientFactory httpClientFactory, ILogger<CategoryScraperService> logger)
    {
        // Using a standard client but setting a desktop user-agent to bypass basic blocks
        _httpClient = httpClientFactory.CreateClient("AIAgentClient");
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        }
        if (!_httpClient.DefaultRequestHeaders.Contains("Accept-Language"))
        {
            _httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
        }
        _logger = logger;
    }

    public async Task<List<CategoryDeal>> FindDealsInCategoryAsync(string categoryUrl, decimal minDiscount)
    {
        var deals = new List<CategoryDeal>();
        try
        {
            var html = await _httpClient.GetStringAsync(categoryUrl);
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

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
                    if (!url.StartsWith("http")) url = "https://www.amazon.de" + url;

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
