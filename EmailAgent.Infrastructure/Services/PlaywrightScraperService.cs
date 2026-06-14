using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using EmailAgent.Core.Interfaces;
using EmailAgent.Infrastructure.Scraping.Interfaces;

namespace EmailAgent.Infrastructure.Services;

public class PlaywrightScraperService : IBrowserProvider, IAsyncDisposable
{
    private readonly ILogger<PlaywrightScraperService> _logger;
    private readonly IScraperConfig _scraperConfig;
    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private readonly SemaphoreSlim _initLock = new SemaphoreSlim(1, 1);

    public PlaywrightScraperService(ILogger<PlaywrightScraperService> logger, IScraperConfig scraperConfig)
    {
        _logger = logger;
        _scraperConfig = scraperConfig;
    }

    public async Task InitializeAsync()
    {
        if (_playwright != null && _browser != null) return;

        await _initLock.WaitAsync();
        try
        {
            if (_playwright == null)
            {
                _logger.LogInformation("Initializing Playwright Engine...");
                _playwright = await Playwright.CreateAsync();
                
                string? cdpUrl = Environment.GetEnvironmentVariable("SCRAPER_CDP_URL");
                
                if (!string.IsNullOrEmpty(cdpUrl))
                {
                    _logger.LogInformation("Connecting to Scraping Browser over CDP (CDP URL provided)...");
                    _browser = await _playwright.Chromium.ConnectOverCDPAsync(cdpUrl);
                    _logger.LogInformation("Connected to Scraping Browser successfully.");
                }
                else
                {
                    bool useHeadless = Environment.GetEnvironmentVariable("SCRAPER_HEADLESS") != "false";
                    var argsList = new System.Collections.Generic.List<string>
                    {
                        "--disable-blink-features=AutomationControlled",
                        "--disable-infobars",
                        "--no-sandbox",
                        "--disable-setuid-sandbox"
                    };
                    if (useHeadless)
                    {
                        argsList.Add("--headless=new");
                    }

                    string proxyServer = _scraperConfig.ScraperApiProxyServer;
                    string proxyUser = _scraperConfig.ScraperApiProxyUsername;
                    string proxyPass = _scraperConfig.ScraperApiProxyPassword;

                    Proxy? proxyConfig = null;
                    if (!string.IsNullOrEmpty(proxyServer))
                    {
                        _logger.LogInformation("Configuring Playwright with Proxy Server: {ProxyServer} (Render: True, Country: TR)", proxyServer);
                        proxyConfig = new Proxy
                        {
                            Server = proxyServer,
                            Username = proxyUser,
                            Password = proxyPass
                        };
                    }

                    try
                    {
                        var chromeOptions = new BrowserTypeLaunchOptions 
                        { 
                            Headless = useHeadless,
                            Channel = "chrome",
                            Args = argsList.ToArray(),
                            Proxy = proxyConfig
                        };
                        _logger.LogInformation("Attempting to launch real Chrome (Headless: {Headless})...", useHeadless);
                        _browser = await _playwright.Chromium.LaunchAsync(chromeOptions);
                        _logger.LogInformation("✅ Real Chrome launched successfully. Best anti-detect mode active.");
                    }
                    catch (Exception chromeEx)
                    {
                        _logger.LogWarning("Real Chrome not available ({Message}). Falling back to bundled Chromium...", chromeEx.Message);
                        var chromiumOptions = new BrowserTypeLaunchOptions 
                        { 
                            Headless = useHeadless,
                            Args = argsList.ToArray(),
                            Proxy = proxyConfig
                        };
                        _browser = await _playwright.Chromium.LaunchAsync(chromiumOptions);
                        _logger.LogInformation("⚠️ Bundled Chromium launched. Some sites may detect bot traffic.");
                    }
                }
            }
        }
        finally
        {
            _initLock.Release();
        }
    }

    public async Task<IBrowser> GetBrowserAsync()
    {
        await InitializeAsync();
        if (_browser == null) throw new InvalidOperationException("Browser initialization failed.");
        return _browser;
    }

    public async Task<IPage> NewPageAsync()
    {
        var browser = await GetBrowserAsync();
        return await browser.NewPageAsync();
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser != null)
        {
            await _browser.DisposeAsync();
        }
        _playwright?.Dispose();
        _initLock.Dispose();
    }
}
