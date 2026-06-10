using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Infrastructure.Services;
using EmailAgent.Infrastructure.Notifications;
using EmailAgent.Core.Entities;
using System.Net.Http;

namespace EmailAgent.Infrastructure.Jobs;

public class ShoppingTrackerJob
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly ProductScraperService _scraperService;
    private readonly CategoryScraperService _categoryScraperService;
    private readonly EmailAgent.Agent.DealEvaluatorAgent _dealEvaluatorAgent;
    private readonly ITelegramNotificationService _telegramService;
    private readonly IWhatsAppNotificationService _whatsAppService;
    private readonly ILogger<ShoppingTrackerJob> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public ShoppingTrackerJob(
        EmailAgentDbContext dbContext,
        ProductScraperService scraperService,
        CategoryScraperService categoryScraperService,
        EmailAgent.Agent.DealEvaluatorAgent dealEvaluatorAgent,
        ITelegramNotificationService telegramService,
        IWhatsAppNotificationService whatsAppService,
        ILogger<ShoppingTrackerJob> logger,
        IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _scraperService = scraperService;
        _categoryScraperService = categoryScraperService;
        _dealEvaluatorAgent = dealEvaluatorAgent;
        _telegramService = telegramService;
        _whatsAppService = whatsAppService;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task CheckPricesAsync()
    {
        await CleanupOldDealsAsync();
        await CheckProductsAsync();
        await CheckCategoriesAsync();
        await CheckCategoryComparisonsAsync();
    }

    private async Task CleanupOldDealsAsync()
    {
        _logger.LogInformation("Cleaning up old notified category deals...");
        var thirtyDaysAgo = DateTimeOffset.UtcNow.AddDays(-30);
        
        // ExecuteDeleteAsync is an efficient way to delete without loading into memory (EF Core 7+)
        var deletedCount = await _dbContext.NotifiedCategoryDeals
            .Where(d => d.NotifiedAt < thirtyDaysAgo)
            .ExecuteDeleteAsync();
            
        if (deletedCount > 0)
        {
            _logger.LogInformation("Cleaned up {Count} old category deals from memory to prevent database bloat.", deletedCount);
        }
    }

    private async Task CheckProductsAsync()
    {
        _logger.LogInformation("Starting Shopping Tracker Job...");

        var trackedProducts = await _dbContext.TrackedProducts
            .Where(p => p.IsActive)
            .ToListAsync();

        foreach (var product in trackedProducts)
        {
            var userPrefs = await _dbContext.UserPreferences.FindAsync(product.UserId);
            if (userPrefs == null) continue;

            // Interval Check
            if ((DateTimeOffset.UtcNow - product.LastCheckedAt).TotalHours < userPrefs.ShoppingTrackerIntervalHours)
            {
                continue;
            }

            try
            {
                var result = await _scraperService.ScrapeProductAsync(product.Url);
                if (result.Price.HasValue && result.Price.Value > 0)
                {
                    if (string.IsNullOrEmpty(product.Title) && !string.IsNullOrEmpty(result.Title))
                        product.Title = result.Title;

                    bool wasInStock = product.IsInStock;
                    bool nowInStock = result.IsInStock;

                    product.LastKnownPrice = result.Price.Value;
                    product.Currency = result.Currency ?? product.Currency;
                    product.LastCheckedAt = DateTimeOffset.UtcNow;
                    product.IsInStock = nowInStock;

                    // Save price history snapshot
                    _dbContext.PriceHistories.Add(new PriceHistory
                    {
                        ProductId = product.Id,
                        Price = result.Price.Value,
                        IsInStock = nowInStock,
                        CheckedAt = DateTime.UtcNow
                    });

                    _logger.LogInformation("Scraped {Title}: {Price} {Currency} InStock={InStock}", product.Title, product.LastKnownPrice, product.Currency, nowInStock);

                    // Stock alert: was out of stock, now back in!
                    if (!wasInStock && nowInStock)
                    {
                        await NotifyStockReturnedAsync(product);
                    }

                    // Price drop alert
                    if (product.LastKnownPrice <= product.TargetPrice && nowInStock)
                    {
                        // SPAM PREVENTION: Only notify if we haven't notified before, OR if the price dropped even further since last notification
                        if (product.LastNotifiedPrice == null || product.LastKnownPrice < product.LastNotifiedPrice.Value)
                        {
                            await NotifyUserAsync(product);
                            product.LastNotifiedPrice = product.LastKnownPrice;
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Scraper returned 0 or null price for active product {Url}. Skipping update to prevent false alerts.", product.Url);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to track product {Url}", product.Url);
            }
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task CheckCategoriesAsync()
    {
        _logger.LogInformation("Starting Category Tracker Job...");
        var trackedCategories = await _dbContext.TrackedCategories.ToListAsync();

        var eurToTry = 35.0; // fallback
        try
        {
            var httpClient = _httpClientFactory.CreateClient("AIAgentClient");
            var response = await httpClient.GetStringAsync("https://api.frankfurter.app/latest?from=EUR&to=TRY");
            using var doc = System.Text.Json.JsonDocument.Parse(response);
            if (doc.RootElement.GetProperty("rates").TryGetProperty("TRY", out var rateElement))
            {
                eurToTry = rateElement.GetDouble();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch EUR to TRY rate. Using fallback.");
        }

        foreach (var category in trackedCategories)
        {
            try
            {
                var userPrefs = await _dbContext.UserPreferences.FindAsync(category.UserId);
                if (userPrefs == null) continue;

                // Interval Check
                if (category.LastCheckedAt.HasValue && (DateTimeOffset.UtcNow.UtcDateTime - category.LastCheckedAt.Value).TotalHours < userPrefs.ShoppingTrackerIntervalHours)
                {
                    continue;
                }

                var deals = await _categoryScraperService.FindDealsInCategoryAsync(userPrefs, category.CategoryUrl, category.MinDiscountPercentage);
                var topDeals = deals.OrderByDescending(d => d.DiscountPercentage).Take(5).ToList();
                foreach (var deal in topDeals)
                {
                    // SMART FILTERING
                    if (!string.IsNullOrEmpty(category.RequiredFeatures))
                    {
                        bool isMatch = await _dealEvaluatorAgent.EvaluateDealAsync(userPrefs, deal.Title, category.RequiredFeatures);
                        if (!isMatch)
                        {
                            _logger.LogInformation("Deal {Title} was filtered out because it didn't match '{Features}'", deal.Title, category.RequiredFeatures);
                            continue; // Skip this deal, it's probably an accessory or wrong model
                        }
                    }

                    // CATEGORY DEAL SPAM PREVENTION
                    var existingNotifiedDeal = await _dbContext.NotifiedCategoryDeals
                        .FirstOrDefaultAsync(d => d.TrackedCategoryId == category.Id && d.ProductUrl == deal.ProductUrl);

                    if (existingNotifiedDeal == null)
                    {
                        // New deal, never notified
                        await NotifyCategoryDealAsync(userPrefs, category, deal, eurToTry);
                        _dbContext.NotifiedCategoryDeals.Add(new NotifiedCategoryDeal
                        {
                            TrackedCategoryId = category.Id,
                            UserId = category.UserId,
                            ProductUrl = deal.ProductUrl,
                            NotifiedPrice = deal.CurrentPrice
                        });
                    }
                    else if (deal.CurrentPrice < existingNotifiedDeal.NotifiedPrice)
                    {
                        // Deal got even cheaper since last notification
                        await NotifyCategoryDealAsync(userPrefs, category, deal, eurToTry);
                        existingNotifiedDeal.NotifiedPrice = deal.CurrentPrice;
                        existingNotifiedDeal.NotifiedAt = DateTimeOffset.UtcNow;
                    }
                    else
                    {
                        // Already notified and price is the same or higher. Skip to prevent spam.
                        _logger.LogInformation("Skipped category deal notification for {Url} because it was already notified at {Price}.", deal.ProductUrl, existingNotifiedDeal.NotifiedPrice);
                    }
                }
                
                category.LastCheckedAt = DateTimeOffset.UtcNow.UtcDateTime;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check category {Url}", category.CategoryUrl);
            }
        }
        await _dbContext.SaveChangesAsync();
    }

    private async Task CheckCategoryComparisonsAsync()
    {
        _logger.LogInformation("Starting Category Comparison Job...");
        
        var allCategories = await _dbContext.TrackedCategories
            .Where(c => c.ComparisonGroupId != null)
            .ToListAsync();

        var groupedCategories = allCategories.GroupBy(c => c.ComparisonGroupId.Value);

        var eurToPln = 4.3; // fallback
        try
        {
            var httpClient = _httpClientFactory.CreateClient("AIAgentClient");
            var response = await httpClient.GetStringAsync("https://api.frankfurter.app/latest?from=EUR&to=PLN");
            using var doc = System.Text.Json.JsonDocument.Parse(response);
            if (doc.RootElement.GetProperty("rates").TryGetProperty("PLN", out var rateElement))
            {
                eurToPln = rateElement.GetDouble();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch EUR to PLN rate. Using fallback.");
        }

        foreach (var group in groupedCategories)
        {
            if (group.Count() < 2) continue; // Need at least two to compare
            
            var userPrefs = await _dbContext.UserPreferences.FindAsync(group.First().UserId);
            if (userPrefs == null) continue;

            // Interval Check using the first category in the group as a reference
            var refCategory = group.First();
            if (refCategory.LastCheckedAt.HasValue && (DateTimeOffset.UtcNow.UtcDateTime - refCategory.LastCheckedAt.Value).TotalHours < userPrefs.ShoppingTrackerIntervalHours)
            {
                continue;
            }

            var lowestDeals = new Dictionary<TrackedCategory, CategoryDeal>();

            foreach (var category in group)
            {
                // Find top deals, ignore minimum discount to find absolute lowest price for comparison
                var deals = await _categoryScraperService.FindDealsInCategoryAsync(userPrefs, category.CategoryUrl, 0);
                var topDealsToEvaluate = deals.OrderBy(d => d.CurrentPrice).Take(10).ToList();
                
                CategoryDeal? bestDeal = null;
                foreach (var deal in topDealsToEvaluate)
                {
                    if (!string.IsNullOrEmpty(category.RequiredFeatures))
                    {
                        bool isMatch = await _dealEvaluatorAgent.EvaluateDealAsync(userPrefs, deal.Title, category.RequiredFeatures);
                        if (!isMatch) continue;
                    }

                    if (bestDeal == null || deal.CurrentPrice < bestDeal.CurrentPrice)
                    {
                        bestDeal = deal;
                    }
                }

                if (bestDeal != null)
                {
                    lowestDeals[category] = bestDeal;
                }
            }

            if (lowestDeals.Count >= 2)
            {
                var sorted = lowestDeals.OrderBy(kvp => 
                {
                    // Normalize to EUR
                    if (kvp.Key.CategoryUrl.Contains(".pl")) return kvp.Value.CurrentPrice / (decimal)eurToPln;
                    return kvp.Value.CurrentPrice;
                }).ToList();

                var cheapest = sorted.First();
                var secondCheapest = sorted.Skip(1).First();

                var cheapestPriceEur = cheapest.Key.CategoryUrl.Contains(".pl") ? cheapest.Value.CurrentPrice / (decimal)eurToPln : cheapest.Value.CurrentPrice;
                var secondPriceEur = secondCheapest.Key.CategoryUrl.Contains(".pl") ? secondCheapest.Value.CurrentPrice / (decimal)eurToPln : secondCheapest.Value.CurrentPrice;

                // If cheapest is at least MinDiscountPercentage cheaper than second cheapest
                var minDiscountRequired = cheapest.Key.MinDiscountPercentage;
                if (secondPriceEur > 0 && ((secondPriceEur - cheapestPriceEur) / secondPriceEur) * 100 >= minDiscountRequired)
                {
                    string message = $"🌍 **Cross-Border FIRSAT ARBİTRAJI!** 🌍\n\n" +
                                     $"Kıyasladığın kategoride DEV BİR FARK var:\n" +
                                     $"🏆 **KAZANAN:** {cheapest.Key.CategoryName}\n" +
                                     $"📦 Ürün: {cheapest.Value.Title}\n" +
                                     $"💰 Fiyat: ~{Math.Round(cheapestPriceEur, 2)} EUR ({cheapest.Value.CurrentPrice})\n" +
                                     $"🔗 {cheapest.Value.ProductUrl}\n\n" +
                                     $"🥈 Kaybeden: {secondCheapest.Key.CategoryName} (~{Math.Round(secondPriceEur, 2)} EUR)\n\n" +
                                     $"Yani {cheapest.Key.CategoryName} almak tam %{Math.Round(((secondPriceEur - cheapestPriceEur) / secondPriceEur) * 100, 1)} daha ucuz!";
                    
                    if (!string.IsNullOrEmpty(userPrefs.TelegramChatId))
                        await _telegramService.SendMessageAsync(userPrefs, userPrefs.TelegramChatId, message);
                }
            }

            // Update LastCheckedAt for all categories in the group
            foreach (var category in group)
            {
                category.LastCheckedAt = DateTimeOffset.UtcNow.UtcDateTime;
            }
        }
        await _dbContext.SaveChangesAsync();
    }

    private async Task NotifyCategoryDealAsync(UserPreferences userPrefs, TrackedCategory category, CategoryDeal deal, double eurToTryRate)
    {
        var priceInTry = Math.Round(deal.CurrentPrice * (decimal)eurToTryRate, 2);
        var originalPriceInTry = Math.Round(deal.OriginalPrice * (decimal)eurToTryRate, 2);

        string message = $"🚨 **FIRSAT ALARMI! ({category.CategoryName})** 🚨\n\n" +
                         $"Takip ettiğin kategoride muazzam bir indirim yakaladım!\n" +
                         $"📦 Ürün: {deal.Title}\n" +
                         $"📉 İndirim: %{deal.DiscountPercentage:F0}\n" +
                         $"💰 Fiyat: {deal.CurrentPrice} EUR ({priceInTry} TL)\n" +
                         $"❌ Eski Fiyat: {deal.OriginalPrice} EUR ({originalPriceInTry} TL)\n\n" +
                         $"🔗 Link: {deal.ProductUrl}";

        if (!string.IsNullOrEmpty(userPrefs.TelegramChatId))
            await _telegramService.SendMessageAsync(userPrefs, userPrefs.TelegramChatId, message);
    }

    private async Task NotifyStockReturnedAsync(TrackedProduct product)
    {
        var userPrefs = await _dbContext.UserPreferences.FindAsync(product.UserId);
        if (userPrefs == null) return;

        string message = $"📦 **STOK ALARMI** 📦\n\nTakip ettiğin ürün tekrar stoka girdi!\n" +
                         $"📦 Ürün: {product.Title}\n" +
                         $"💰 Güncel Fiyat: {product.LastKnownPrice} {product.Currency}\n\n" +
                         $"🔗 Link: {product.Url}";

        if (!string.IsNullOrEmpty(userPrefs.TelegramChatId))
            await _telegramService.SendMessageAsync(userPrefs, userPrefs.TelegramChatId, message);

        _dbContext.NotificationLogs.Add(new NotificationLog
        {
            UserId = product.UserId,
            Message = message,
            Type = "StockAlert",
            SentAt = DateTime.UtcNow
        });
    }

    private async Task NotifyUserAsync(TrackedProduct product)
    {
        var userPrefs = await _dbContext.UserPreferences.FindAsync(product.UserId);
        if (userPrefs == null) return;

        string message = $"🚨 **İNDİRİM ALARMI** 🚨\n\nTakip ettiğin ürün hedeflenen fiyatın altına düştü!\n" +
                         $"📦 Ürün: {product.Title}\n" +
                         $"💰 Fiyat: {product.LastKnownPrice} {product.Currency}\n" +
                         $"🎯 Hedefin: {product.TargetPrice} {product.Currency}\n\n" +
                         $"🔗 Link: {product.Url}";

        if (!string.IsNullOrEmpty(userPrefs.TelegramChatId))
            await _telegramService.SendMessageAsync(userPrefs, userPrefs.TelegramChatId, message);

        if (!string.IsNullOrEmpty(userPrefs.WhatsAppTo))
            await _whatsAppService.SendMessageAsync(userPrefs, userPrefs.WhatsAppTo, message);

        _dbContext.NotificationLogs.Add(new NotificationLog
        {
            UserId = product.UserId,
            Message = message,
            Type = "PriceDrop",
            SentAt = DateTime.UtcNow
        });
    }
}
