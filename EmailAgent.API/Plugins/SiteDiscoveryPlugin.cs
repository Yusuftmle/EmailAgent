using System;
using System.ComponentModel;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Interfaces;
using EmailAgent.Agent;
using System.Collections.Generic;

namespace EmailAgent.API.Plugins;

public class SiteDiscoveryPlugin
{
    private readonly IStrategyDefinitionRepository _repository;
    private readonly IEnumerable<ISiteStrategy> _strategies;
    private readonly UniversalScraperAgent _scraperAgent;
    private readonly ILogger<SiteDiscoveryPlugin> _logger;
    private readonly UserPreferences _userPrefs;

    public SiteDiscoveryPlugin(
        IStrategyDefinitionRepository repository,
        IEnumerable<ISiteStrategy> strategies,
        UniversalScraperAgent scraperAgent,
        ILogger<SiteDiscoveryPlugin> logger,
        UserPreferences userPrefs)
    {
        _repository = repository;
        _strategies = strategies;
        _scraperAgent = scraperAgent;
        _logger = logger;
        _userPrefs = userPrefs;
    }

    [KernelFunction("check_strategy_exists")]
    [Description("Checks if a scraping strategy is already known and saved in the database for the given domain.")]
    public async Task<string> CheckStrategyExistsAsync(
        [Description("The domain name to check, e.g., 'trendyol.com'")] string domain)
    {
        var strategy = await _repository.GetByDomainAsync(domain);
        if (strategy != null && strategy.Confidence >= 0.4)
        {
            return $"Strategy exists for {domain} with confidence {strategy.Confidence:P0}.";
        }
        else if (strategy != null && strategy.Confidence < 0.4)
        {
            return $"Strategy exists for {domain} but is stale (confidence {strategy.Confidence:P0}). Needs rediscovery.";
        }
        return $"No strategy found for {domain}.";
    }

    [KernelFunction("discover_site_strategy")]
    [Description("Discovers and learns the CSS selectors and scraping method for an unknown site by analyzing its HTML, and saves it to the database.")]
    public async Task<string> DiscoverSiteStrategyAsync(
        [Description("The exact URL of a product page on the target domain to use for discovery.")] string url)
    {
        try
        {
            var uri = new Uri(url);
            var domain = uri.Host;
            
            _logger.LogInformation("Starting AI Discovery for domain: {Domain}", domain);

            var genericStrategy = _strategies.First(s => s.GetType().Name == "GenericStrategy");
            var html = await genericStrategy.FetchHtmlAsync(url);

            if (string.IsNullOrEmpty(html))
            {
                return $"Failed to fetch HTML from {url}. Cannot discover strategy.";
            }

            // Minify HTML to save tokens
            var doc = new HtmlAgilityPack.HtmlDocument();
            doc.LoadHtml(html);
            var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//svg|//nav|//footer|//header|//iframe|//noscript");
            if (nodesToRemove != null)
            {
                foreach (var node in nodesToRemove) node.Remove();
            }
            var minifiedHtml = Regex.Replace(doc.DocumentNode.InnerHtml, @"\s+", " ").Trim();

            var definition = await _scraperAgent.DiscoverSelectorsAsync(_userPrefs, minifiedHtml, domain);
            
            if (definition == null)
            {
                return $"Failed to parse AI response for {domain}.";
            }

            await _repository.SaveAsync(definition);

            return $"Strategy discovered and saved for {domain}. PriceSelector: {definition.PriceSelector}, TitleSelector: {definition.TitleSelector}.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover site strategy for {Url}", url);
            return $"Failed to discover strategy: {ex.Message}";
        }
    }

    [KernelFunction("scrape_with_strategy")]
    [Description("Scrapes a URL using its saved SiteStrategyDefinition.")]
    public async Task<string> ScrapeWithStrategyAsync(
        [Description("The exact URL of the product page to scrape.")] string url)
    {
        try
        {
            var uri = new Uri(url);
            var domain = uri.Host;

            var definition = await _repository.GetByDomainAsync(domain);
            if (definition == null)
            {
                return $"No strategy definition found for {domain}. Call discover_site_strategy first.";
            }

            // Find DynamicDatabaseStrategy to execute this
            var dynamicStrategy = _strategies.FirstOrDefault(s => s.GetType().Name == "DynamicDatabaseStrategy");
            if (dynamicStrategy == null)
            {
                return "DynamicDatabaseStrategy is not registered in the orchestrator.";
            }

            var result = await dynamicStrategy.ParseProductAsync(url, await dynamicStrategy.FetchHtmlAsync(url));

            return JsonSerializer.Serialize(new
            {
                Price = result.Price,
                Currency = result.Currency,
                Title = result.Title,
                IsInStock = result.IsInStock
            });
        }
        catch (Exception ex)
        {
            return $"Scraping failed: {ex.Message}";
        }
    }
}
