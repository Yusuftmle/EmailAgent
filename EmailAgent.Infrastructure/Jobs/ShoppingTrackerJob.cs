using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Infrastructure.Services;
using EmailAgent.Infrastructure.Notifications;
using EmailAgent.Core.Entities;

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

    public ShoppingTrackerJob(
        EmailAgentDbContext dbContext,
        ProductScraperService scraperService,
        CategoryScraperService categoryScraperService,
        EmailAgent.Agent.DealEvaluatorAgent dealEvaluatorAgent,
        ITelegramNotificationService telegramService,
        IWhatsAppNotificationService whatsAppService,
        ILogger<ShoppingTrackerJob> logger)
    {
        _dbContext = dbContext;
        _scraperService = scraperService;
        _categoryScraperService = categoryScraperService;
        _dealEvaluatorAgent = dealEvaluatorAgent;
        _telegramService = telegramService;
        _whatsAppService = whatsAppService;
        _logger = logger;
    }

    public async Task CheckPricesAsync()
    {
        await CheckProductsAsync();
        await CheckCategoriesAsync();
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
                
                if (result.Price.HasValue)
                {
                    if (string.IsNullOrEmpty(product.Title) && !string.IsNullOrEmpty(result.Title))
                    {
                        product.Title = result.Title;
                    }

                    product.LastKnownPrice = result.Price.Value;
                    product.Currency = result.Currency ?? product.Currency;
                    product.LastCheckedAt = DateTimeOffset.UtcNow;

                    _logger.LogInformation("Scraped {Title}: {Price} {Currency}", product.Title, product.LastKnownPrice, product.Currency);

                    if (product.LastKnownPrice <= product.TargetPrice)
                    {
                        await NotifyUserAsync(product);
                        // Disable after notifying to prevent spam, or keep it active if user wants continuous updates
                        // product.IsActive = false; 
                    }
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
            using var httpClient = new System.Net.Http.HttpClient();
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

                var deals = await _categoryScraperService.FindDealsInCategoryAsync(category.CategoryUrl, category.MinDiscountPercentage);
                foreach (var deal in deals)
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

                    await NotifyCategoryDealAsync(userPrefs, category, deal, eurToTry);
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
            await _telegramService.SendMessageAsync(userPrefs.TelegramChatId, message);
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

        // Send to Telegram
        if (!string.IsNullOrEmpty(userPrefs.TelegramChatId))
        {
            await _telegramService.SendMessageAsync(userPrefs.TelegramChatId, message);
        }

        // Send to WhatsApp
        if (!string.IsNullOrEmpty(userPrefs.WhatsAppTo))
        {
            await _whatsAppService.SendMessageAsync(userPrefs, userPrefs.WhatsAppTo, message);
        }
    }
}
