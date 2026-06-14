using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Interfaces;

namespace EmailAgent.Infrastructure.Services;

public class CategoryScraperService
{
    private readonly IEnumerable<ISiteStrategy> _strategies;
    private readonly ILogger<CategoryScraperService> _logger;

    public CategoryScraperService(
        IEnumerable<ISiteStrategy> strategies, 
        ILogger<CategoryScraperService> logger)
    {
        _strategies = strategies;
        _logger = logger;
    }

    public async Task<string> GetHtmlAsync(string url)
    {
        var strategy = _strategies.FirstOrDefault(s => s.CanHandle(url)) 
                    ?? _strategies.First(s => s.GetType().Name == "GenericStrategy");
        return await strategy.FetchHtmlAsync(url);
    }

    public async Task<List<CategoryDeal>> FindDealsInCategoryAsync(UserPreferences userPrefs, string categoryUrl, decimal minDiscount)
    {
        try
        {
            var strategy = _strategies.FirstOrDefault(s => s.CanHandle(categoryUrl)) 
                        ?? _strategies.First(s => s.GetType().Name == "GenericStrategy");
                        
            _logger.LogInformation("Selected Strategy {Strategy} for Category URL: {Url}", strategy.GetType().Name, categoryUrl);

            var html = await strategy.FetchHtmlAsync(categoryUrl);

            if (string.IsNullOrEmpty(html))
            {
                _logger.LogWarning("FetchHtmlAsync returned empty string for {Url}", categoryUrl);
                return new List<CategoryDeal>();
            }

            return await strategy.ParseCategoryDealsAsync(categoryUrl, html, minDiscount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch or parse category page: {Url}", categoryUrl);
            return new List<CategoryDeal>();
        }
    }
}
