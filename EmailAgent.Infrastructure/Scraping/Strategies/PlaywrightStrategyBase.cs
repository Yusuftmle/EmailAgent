using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using EmailAgent.Core.Interfaces;
using EmailAgent.Core.Entities;
using System.Collections.Generic;
using EmailAgent.Infrastructure.Scraping.Interfaces;

namespace EmailAgent.Infrastructure.Scraping.Strategies;

public abstract class PlaywrightStrategyBase : ISiteStrategy
{
    protected readonly IBrowserProvider _browserProvider;
    protected readonly ILogger _logger;

    // Circuit Breaker to prevent ban cascades on domains
    private static readonly ConcurrentDictionary<string, (int FailCount, DateTimeOffset NextAllowedTime)> _circuitBreaker = new();
    // Session locks per domain to protect session file read/writes from concurrent operations
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _sessionLocks = new();

    protected PlaywrightStrategyBase(IBrowserProvider browserProvider, ILogger logger)
    {
        _browserProvider = browserProvider;
        _logger = logger;
    }

    public abstract bool CanHandle(string url);

    public virtual async Task<string> FetchHtmlAsync(string url)
    {
        var uri = new Uri(url);
        var domain = uri.Host;
        string safeDomain = domain.Replace(".", "_").Replace(":", "_");
        string sessionStatePath = $"session_state_{safeDomain}.json";

        if (_circuitBreaker.TryGetValue(domain, out var breaker))
        {
            if (DateTimeOffset.UtcNow < breaker.NextAllowedTime)
            {
                var waitMinutes = Math.Ceiling((breaker.NextAllowedTime - DateTimeOffset.UtcNow).TotalMinutes);
                _logger.LogWarning("Circuit breaker is OPEN for {Domain}. Try again in {WaitMinutes} minutes.", domain, waitMinutes);
                throw new Exception($"Geçici engelleme: {domain} (Circuit Breaker)");
            }
        }

        var domainLock = _sessionLocks.GetOrAdd(domain, _ => new SemaphoreSlim(1, 1));
        await domainLock.WaitAsync();
        try
        {
            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    var html = await GetHtmlInternalAsync(url, sessionStatePath, domain);
                    _circuitBreaker.TryRemove(domain, out _);
                    return html;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Attempt {Attempt} failed for URL: {Url}", attempt, url);
                    
                    bool isHardBlock = ex.Message.Contains("Hard Block") || ex.Message.Contains("Circuit Breaker");
                    if (isHardBlock)
                    {
                        if (File.Exists(sessionStatePath)) File.Delete(sessionStatePath);
                        var currentFails = _circuitBreaker.AddOrUpdate(domain, (1, DateTimeOffset.MinValue), (k, v) => (v.FailCount + 1, v.NextAllowedTime));
                        if (currentFails.FailCount >= 3)
                        {
                            _circuitBreaker[domain] = (currentFails.FailCount, DateTimeOffset.UtcNow.AddMinutes(15));
                        }
                        throw;
                    }

                    if (attempt == maxRetries)
                    {
                        if (File.Exists(sessionStatePath)) File.Delete(sessionStatePath);
                        var currentFails = _circuitBreaker.AddOrUpdate(domain, (1, DateTimeOffset.MinValue), (k, v) => (v.FailCount + 1, v.NextAllowedTime));
                        if (currentFails.FailCount >= 3)
                        {
                            _circuitBreaker[domain] = (currentFails.FailCount, DateTimeOffset.UtcNow.AddMinutes(15));
                        }
                        throw;
                    }
                    await Task.Delay(TimeSpan.FromSeconds(3 * attempt));
                }
            }
        }
        finally
        {
            domainLock.Release();
        }
        throw new InvalidOperationException("Unexpected end of FetchHtmlAsync");
    }

    private async Task<string> GetHtmlInternalAsync(string url, string sessionStatePath, string domain)
    {
        var browser = await _browserProvider.GetBrowserAsync();
        
        var contextOptions = new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = 1920, Height = 1080 },
            ColorScheme = ColorScheme.Dark,
            HasTouch = false,
            IgnoreHTTPSErrors = true
        };

        if (File.Exists(sessionStatePath))
        {
            contextOptions.StorageStatePath = sessionStatePath;
        }

        await using var context = await browser.NewContextAsync(contextOptions);
        
        // Stealth Plugin equivalent: inject scripts to bypass bot detection
        await context.AddInitScriptAsync(@"
            if (navigator.webdriver) { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined }); } catch (e) {} }
            if (!window.chrome) { window.chrome = { runtime: {} }; }
        ");

        var page = await context.NewPageAsync();

        try
        {
            var response = await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.Commit, Timeout = 45000 });
            
            if (response == null) throw new Exception("Response is null.");
            if (response.Status == 429) throw new Exception($"Blocked by server with status {response.Status}. Too Many Requests.");
            if (response.Status == 403) throw new Exception("403 Forbidden. Possible Hard Block.");

            // Mouse Wheel Scroll down to trigger lazy loading
            var random = new Random();
            for (int i = 0; i < 3; i++)
            {
                await page.Mouse.WheelAsync(0, random.Next(300, 800));
                await Task.Delay(random.Next(800, 2000));
            }

            await Task.Delay(random.Next(1000, 2500));
            await context.StorageStateAsync(new BrowserContextStorageStateOptions { Path = sessionStatePath });

            return await page.ContentAsync();
        }
        catch (Exception)
        {
            throw;
        }
    }

    public abstract Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ParseProductAsync(string url, string html);
    public abstract Task<List<CategoryDeal>> ParseCategoryDealsAsync(string categoryUrl, string html, decimal minDiscount);
}
