using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly EmailAgentDbContext _context;

    public DashboardController(EmailAgentDbContext context)
    {
        _context = context;
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
        // (A simple approximation since we don't store original price permanently in a clean way,
        // we can calculate savings from TrackedProducts that met target)
        var metTargetProducts = await _context.TrackedProducts
            .Where(t => t.UserId == uid && t.LastKnownPrice <= t.TargetPrice && t.TargetPrice > 0)
            .ToListAsync();
        
        var totalSavings = metTargetProducts.Sum(t => t.TargetPrice - t.LastKnownPrice);

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
