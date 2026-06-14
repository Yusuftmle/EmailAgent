namespace EmailAgent.Core.Interfaces;

public interface IScraperConfig
{
    string ScraperApiKey { get; }
    string ScraperApiProxyServer { get; }
    string ScraperApiProxyUsername { get; }
    string ScraperApiProxyPassword { get; }
    string SerperApiKey { get; }
}
