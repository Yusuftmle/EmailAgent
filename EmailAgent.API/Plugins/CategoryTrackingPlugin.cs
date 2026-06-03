using System;
using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Core.Entities;

namespace EmailAgent.API.Plugins;

public class CategoryTrackingPlugin
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly Guid _userId;

    public CategoryTrackingPlugin(EmailAgentDbContext dbContext, Guid userId)
    {
        _dbContext = dbContext;
        _userId = userId;
    }

    [KernelFunction("TrackCategory")]
    [Description("Starts tracking a specific category URL (like Amazon Germany category/search page) to notify the user when any product in that category drops in price by a certain percentage. Call this when the user says 'bana şu kategorideki indirimleri haber ver' or 'su sayfayi takibe al'.")]
    public async Task<string> TrackCategoryAsync(
        [Description("The exact URL of the category or search results page to track.")] string categoryUrl,
        [Description("A short, human-readable name for this category (e.g., 'Gaming Laptops', 'LG Monitors').")] string categoryName,
        [Description("The minimum discount percentage required to trigger an alert (e.g., 15 for 15%). If the user doesn't specify, default to 15.")] decimal minDiscountPercentage = 15,
        [Description("Optional. Specific features or keywords the user wants to filter by (e.g., 'iPhone 13 Pro classification only, no accessories'). AI will use this to evaluate deals.")] string? requiredFeatures = null,
        [Description("An optional Guid to link multiple categories together for cross-border comparison. Generate a new Guid if starting a new comparison group, and pass the same Guid to both.")] string? comparisonGroupId = null)
    {
        try
        {
            Guid? groupId = null;
            if (!string.IsNullOrEmpty(comparisonGroupId) && Guid.TryParse(comparisonGroupId, out Guid parsedId))
            {
                groupId = parsedId;
            }

            var trackedCategory = new TrackedCategory
            {
                UserId = _userId,
                CategoryUrl = categoryUrl,
                CategoryName = categoryName,
                MinDiscountPercentage = minDiscountPercentage,
                RequiredFeatures = requiredFeatures,
                ComparisonGroupId = groupId,
                CreatedAt = DateTimeOffset.UtcNow.UtcDateTime
            };

            _dbContext.TrackedCategories.Add(trackedCategory);
            await _dbContext.SaveChangesAsync();

            return $"Success: Successfully started tracking category '{categoryName}'. The system will now scan this category every 12 hours and send a Telegram alert if any product drops by at least %{minDiscountPercentage}.";
        }
        catch (Exception ex)
        {
            return $"Error: Failed to track category. {ex.Message}";
        }
    }
}
