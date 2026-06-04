using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Infrastructure.Data;
using System.Net.Http;
using System.Text.Json;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly EmailAgentDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;

    public DashboardController(EmailAgentDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string userId)
    {
        if (!Guid.TryParse(userId, out var uid))
            return BadRequest("Invalid user ID");

        var totalEmails = await _context.EmailAnalyses.CountAsync(e => e.UserId == uid);
        var totalChats = await _context.ChatHistories.CountAsync(c => c.UserId == uid);
        var totalTrackedProducts = await _context.TrackedProducts.CountAsync(t => t.UserId == uid);

        var hoursSaved = Math.Round((totalEmails * 8.0 + totalChats * 5.0) / 60.0, 1);

        // Calculate Total Savings: SUM(TargetPrice - LastKnownPrice) where LastKnownPrice <= TargetPrice
        var metTargetProducts = await _context.TrackedProducts
            .Where(t => t.UserId == uid && t.LastKnownPrice <= t.TargetPrice && t.TargetPrice > 0)
            .ToListAsync();
        
        decimal totalSavings = 0;
        
        if (metTargetProducts.Any())
        {
            // Try to fetch exchange rates to convert everything to TRY
            decimal eurToTry = 35.0m; // Fallback rates
            decimal usdToTry = 32.0m;
            decimal gbpToTry = 40.0m;

            try
            {
                var client = _httpClientFactory.CreateClient("AIAgentClient");
                var response = await client.GetAsync("https://api.frankfurter.app/latest?to=TRY,USD,GBP");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("rates", out var rates))
                    {
                        if (rates.TryGetProperty("TRY", out var tryRate)) eurToTry = tryRate.GetDecimal();
                        
                        // Calculate USD and GBP to TRY by dividing EUR/TRY by EUR/USD
                        if (rates.TryGetProperty("USD", out var usdRate)) usdToTry = eurToTry / usdRate.GetDecimal();
                        if (rates.TryGetProperty("GBP", out var gbpRate)) gbpToTry = eurToTry / gbpRate.GetDecimal();
                    }
                }
            }
            catch (Exception)
            {
                // Silently fallback to hardcoded rates if API fails
            }

            foreach (var p in metTargetProducts)
            {
                var diff = p.TargetPrice - p.LastKnownPrice;
                var curr = (p.Currency ?? "TRY").ToUpper();

                if (curr == "EUR") totalSavings += diff * eurToTry;
                else if (curr == "USD") totalSavings += diff * usdToTry;
                else if (curr == "GBP") totalSavings += diff * gbpToTry;
                else totalSavings += diff; // Assume it's TRY or unknown
            }
        }
        
        totalSavings = Math.Round(totalSavings, 2);

        return Ok(new
        {
            TotalEmails = totalEmails,
            TotalChats = totalChats,
            TotalTrackedProducts = totalTrackedProducts,
            HoursSaved = hoursSaved,
            TotalSavings = totalSavings
        });
    }

    [HttpGet("tracked-products")]
    public async Task<IActionResult> GetTrackedProducts([FromQuery] string userId)
    {
        if (!Guid.TryParse(userId, out var uid))
            return BadRequest("Invalid user ID");

        var products = await _context.TrackedProducts
            .Where(t => t.UserId == uid && t.IsActive)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("tracked-categories")]
    public async Task<IActionResult> GetTrackedCategories([FromQuery] string userId)
    {
        if (!Guid.TryParse(userId, out var uid))
            return BadRequest("Invalid user ID");

        var categories = await _context.TrackedCategories
            .Where(t => t.UserId == uid)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("price-history/{productId}")]
    public async Task<IActionResult> GetPriceHistory(Guid productId)
    {
        var history = await _context.PriceHistories
            .Where(p => p.ProductId == productId)
            .OrderBy(p => p.CheckedAt)
            .ToListAsync();
            
        return Ok(history);
    }

    [HttpGet("notification-log")]
    public async Task<IActionResult> GetNotificationLogs([FromQuery] string userId)
    {
        if (!Guid.TryParse(userId, out var uid))
            return BadRequest("Invalid user ID");

        var logs = await _context.NotificationLogs
            .Where(n => n.UserId == uid)
            .OrderByDescending(n => n.SentAt)
            .Take(50)
            .ToListAsync();

        return Ok(logs);
    }
}
