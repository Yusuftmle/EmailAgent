using System;
using System.ComponentModel;
using System.Threading.Tasks;
using EmailAgent.Core.Entities;
using EmailAgent.Infrastructure.Data;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;

namespace EmailAgent.API.Plugins;

public class DeltaTrackingPlugin
{
    private readonly ILogger<DeltaTrackingPlugin> _logger;
    private readonly EmailAgentDbContext _dbContext;

    public DeltaTrackingPlugin(ILogger<DeltaTrackingPlugin> logger, EmailAgentDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [KernelFunction("start_delta_tracking")]
    [Description("Starts a background delta tracking job for a specific product category to find newly listed or price-dropped items. Call this when the user asks to be notified when a specific type of item drops below a certain price.")]
    public async Task<string> StartDeltaTrackingAsync(
        [Description("The URL of the category page to track (e.g. sahibinden, amazon, or autoscout URL)")] string categoryUrl,
        [Description("A human readable name for the category (e.g. '800k altı boyasız Golf')")] string categoryName,
        [Description("The minimum discount percentage required to trigger a notification, usually 5-15")] double minDiscountPercentage,
        [Description("Required features the user specifically requested (e.g. 'boyasız, tramersiz, otomatik')")] string? requiredFeatures = null)
    {
        _logger.LogInformation("Creating Delta Tracking rule for {CategoryName}...", categoryName);

        // Normally we'd extract the user from the context, hardcoding a Guid for now or getting from DB
        var userPref = await _dbContext.UserPreferences.FirstOrDefaultAsync();
        if (userPref == null) return "Error: User preferences not found.";

        var trackedCategory = new TrackedCategory
        {
            Id = Guid.NewGuid(),
            UserId = userPref.Id,
            CategoryUrl = categoryUrl,
            CategoryName = categoryName,
            MinDiscountPercentage = (decimal)minDiscountPercentage,
            RequiredFeatures = requiredFeatures,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.TrackedCategories.Add(trackedCategory);
        await _dbContext.SaveChangesAsync();

        // Schedule the Background Job using Hangfire
        // In a real scenario, this would call the new AegisV3 Funnel Pipeline Job
        BackgroundJob.Enqueue<EmailAgent.Infrastructure.Jobs.ShoppingTrackerJob>(job => job.RunAegisPipelineForCategoryAsync(trackedCategory.Id));

        return $"Başarıyla {categoryName} için Delta Tarama (Incremental Tracking) başlatıldı. Bu kurala uyan yeni bir fırsat düştüğünde size haber vereceğim.";
    }
}
