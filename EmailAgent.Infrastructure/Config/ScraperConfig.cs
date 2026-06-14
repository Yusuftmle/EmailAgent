using EmailAgent.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using System;

namespace EmailAgent.Infrastructure.Config;

public class ScraperConfig : IScraperConfig
{
    private readonly IConfiguration _configuration;

    public ScraperConfig(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string ScraperApiKey => 
        Environment.GetEnvironmentVariable("SCRAPER_API_KEY") ?? 
        _configuration["ScraperAPI:ApiKey"] ?? 
        throw new InvalidOperationException("Scraper API Key is missing.");

    public string ScraperApiProxyServer => 
        Environment.GetEnvironmentVariable("SCRAPER_PROXY_SERVER") ?? 
        _configuration["ScraperAPI:ProxyServer"] ?? 
        "";

    public string ScraperApiProxyUsername => 
        Environment.GetEnvironmentVariable("SCRAPER_PROXY_USERNAME") ?? 
        _configuration["ScraperAPI:ProxyUsername"] ?? 
        "";

    public string ScraperApiProxyPassword => 
        Environment.GetEnvironmentVariable("SCRAPER_PROXY_PASSWORD") ?? 
        _configuration["ScraperAPI:ProxyPassword"] ?? 
        "";

    public string SerperApiKey => 
        Environment.GetEnvironmentVariable("SERPER_API_KEY") ?? 
        _configuration["SerperAPI:ApiKey"] ?? 
        throw new InvalidOperationException("Serper API Key is missing.");
}
