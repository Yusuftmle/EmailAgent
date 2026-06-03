using System;
using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Core.Entities;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.API.Plugins;

public class ShoppingPlugin
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly EmailAgent.Infrastructure.Services.ProductScraperService _scraperService;
    private readonly Guid _userId;

    public ShoppingPlugin(EmailAgentDbContext dbContext, EmailAgent.Infrastructure.Services.ProductScraperService scraperService, Guid userId)
    {
        _dbContext = dbContext;
        _scraperService = scraperService;
        _userId = userId;
    }

    [KernelFunction, Description("Adds a product URL to the tracking list to be monitored for price drops.")]
    public async Task<string> TrackProductPriceAsync(
        [Description("The URL of the product to track")] string url,
        [Description("The target price threshold (e.g., 100.00). If the price drops below this, the user will be alerted.")] double targetPrice)
    {
        try
        {
            var (scrapedPrice, currency, title) = await _scraperService.ScrapeProductAsync(url);
            decimal initialPrice = scrapedPrice ?? 0m;

            var trackedProduct = new TrackedProduct
            {
                UserId = _userId,
                Url = url,
                TargetPrice = (decimal)targetPrice,
                LastKnownPrice = initialPrice,
                Currency = currency ?? "EUR",
                Title = title ?? "Unknown Product",
                CreatedAt = DateTimeOffset.UtcNow,
                LastCheckedAt = DateTimeOffset.UtcNow,
                IsActive = true
            };

            await _dbContext.TrackedProducts.AddAsync(trackedProduct);
            await _dbContext.SaveChangesAsync();

            if (scrapedPrice.HasValue)
            {
                return $"Success: Product at {url} is now being tracked. Target price set to {targetPrice}. The current scraped price is {scrapedPrice} {currency}. The background job will monitor it for further changes.";
            }
            return $"Success: Product at {url} is now being tracked. Target price set to {targetPrice}. However, I could not immediately scrape its current price. The background job will keep trying.";
        }
        catch (Exception ex)
        {
            return $"Error adding product tracker: {ex.Message}";
        }
    }

    [KernelFunction, Description("Fetches the real-time current price of a product from an e-commerce URL.")]
    public async Task<string> GetCurrentProductPriceAsync(
        [Description("The URL of the product to scrape")] string url)
    {
        try
        {
            var (price, currency, title) = await _scraperService.ScrapeProductAsync(url);
            if (price.HasValue)
            {
                return $"The current price of the product '{title ?? url}' is {price} {currency}.";
            }
            return $"Could not extract the current price from {url}. The site may be blocking scrapers or the page structure is unsupported.";
        }
        catch (Exception ex)
        {
            return $"Error fetching product price: {ex.Message}";
        }
    }
}
