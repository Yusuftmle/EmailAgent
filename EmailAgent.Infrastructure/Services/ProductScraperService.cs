using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Interfaces;

namespace EmailAgent.Infrastructure.Services;

public class ProductScraperService
{
    private readonly IEnumerable<ISiteStrategy> _strategies;
    private readonly ILogger<ProductScraperService> _logger;

    public ProductScraperService(
        IEnumerable<ISiteStrategy> strategies,
        ILogger<ProductScraperService> logger)
    {
        _strategies = strategies;
        _logger = logger;
    }

    public async Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ScrapeProductAsync(string url)
    {
        try
        {
            var strategy = _strategies.FirstOrDefault(s => s.CanHandle(url)) 
                        ?? _strategies.First(s => s.GetType().Name == "GenericStrategy");
                        
            _logger.LogInformation("Selected Strategy {Strategy} for URL: {Url}", strategy.GetType().Name, url);

            var html = await strategy.FetchHtmlAsync(url);

            if (string.IsNullOrEmpty(html))
            {
                _logger.LogWarning("FetchHtmlAsync returned empty string for {Url}", url);
                return (null, null, "Unknown Product", null, false);
            }

            return await strategy.ParseProductAsync(url, html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to scrape product from {Url}", url);
            return (null, null, "Unknown Product", null, false);
        }
    }
}
