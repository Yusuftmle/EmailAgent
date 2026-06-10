using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;

namespace EmailAgent.Infrastructure.Services;

public class PlaywrightScraperService : IAsyncDisposable
{
    private readonly ILogger<PlaywrightScraperService> _logger;
    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private const string SessionStatePath = "session_state.json";
    
    // Circuit Breaker to prevent ban cascades on domains
    private static readonly ConcurrentDictionary<string, (int FailCount, DateTimeOffset NextAllowedTime)> _circuitBreaker = new();
    // Add SemaphoreSlim for Thread-Safety during initialization
    private readonly SemaphoreSlim _initLock = new SemaphoreSlim(1, 1);

    private readonly string[] _userAgents = new[]
    {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    };

    private readonly ViewportSize[] _viewports = new[]
    {
        new ViewportSize { Width = 1920, Height = 1080 },
        new ViewportSize { Width = 1366, Height = 768 },
        new ViewportSize { Width = 1440, Height = 900 },
        new ViewportSize { Width = 1536, Height = 864 }
    };

    public PlaywrightScraperService(ILogger<PlaywrightScraperService> logger)
    {
        _logger = logger;
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
                
                // Advanced Stealth: Use headed mode simulation with new headless arg
                _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions 
                { 
                    Headless = false, // Set to false to allow custom args to override properly in some PW versions
                    Args = new[] 
                    { 
                        "--headless=new", // Chrome's new headless mode that mimics headful
                        "--disable-blink-features=AutomationControlled",
                        "--disable-infobars",
                        "--no-sandbox",
                        "--disable-setuid-sandbox"
                    }
                });
                _logger.LogInformation("Playwright Chromium browser launched successfully.");
            }
        }
        finally
        {
            _initLock.Release();
        }
    }

    private async Task MoveMouseBiometricAsync(IPage page, int startX, int startY, int endX, int endY, int steps)
    {
        var random = new Random();
        // Simple quadratic bezier curve logic to simulate human wrist movement
        double ctrlX = startX + (endX - startX) * random.NextDouble() + (random.Next(-100, 100));
        double ctrlY = startY + (endY - startY) * random.NextDouble() + (random.Next(-100, 100));

        for (int i = 0; i <= steps; i++)
        {
            double t = (double)i / steps;
            double u = 1 - t;
            double tt = t * t;
            double uu = u * u;

            double x = (uu * startX) + (2 * u * t * ctrlX) + (tt * endX);
            double y = (uu * startY) + (2 * u * t * ctrlY) + (tt * endY);

            await page.Mouse.MoveAsync((int)x, (int)y);
            await Task.Delay(random.Next(5, 15)); // Human noise delay
        }
    }

    public async Task<string> GetHtmlAsync(string url)
    {
        var domain = new Uri(url).Host;
        if (_circuitBreaker.TryGetValue(domain, out var breaker))
        {
            if (DateTimeOffset.UtcNow < breaker.NextAllowedTime)
            {
                var waitMinutes = Math.Ceiling((breaker.NextAllowedTime - DateTimeOffset.UtcNow).TotalMinutes);
                _logger.LogWarning("Circuit breaker is OPEN for {Domain}. Try again in {WaitMinutes} minutes.", domain, waitMinutes);
                throw new Exception($"Geçici engelleme: {domain} sitesine üst üste yapılan istekler ban yediği için {waitMinutes} dakika boyunca istek atılamaz. (Circuit Breaker)");
            }
        }

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                var html = await GetHtmlInternalAsync(url);
                // On success, reset circuit breaker
                _circuitBreaker.TryRemove(domain, out _);
                return html;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Attempt {Attempt} failed for URL: {Url}", attempt, url);
                
                bool isBanError = ex.Message.Contains("Blocked by server") || ex.Message.Contains("Stuck on Cloudflare");
                
                // On failure, delete the potentially poisoned session state
                if (File.Exists(SessionStatePath))
                {
                    _logger.LogInformation("Deleting poisoned session state.");
                    File.Delete(SessionStatePath);
                }

                if (attempt == maxRetries)
                {
                    if (isBanError)
                    {
                        var currentFails = _circuitBreaker.AddOrUpdate(domain, (1, DateTimeOffset.MinValue), (k, v) => (v.FailCount + 1, v.NextAllowedTime));
                        if (currentFails.FailCount >= 3) // After 3 complete cycle failures (3*3=9 total failed requests or 3 direct cycle failures)
                        {
                            _circuitBreaker[domain] = (currentFails.FailCount, DateTimeOffset.UtcNow.AddMinutes(15));
                            _logger.LogWarning("Circuit breaker TRIPPED for {Domain}. Blocking requests for 15 minutes.", domain);
                        }
                    }
                    _logger.LogError("Max retries reached. Failing.");
                    throw;
                }
                
                // Exponential backoff
                await Task.Delay(TimeSpan.FromSeconds(3 * attempt));
            }
        }
        
        throw new InvalidOperationException("Unexpected end of GetHtmlAsync");
    }

    private async Task<string> GetHtmlInternalAsync(string url)
    {
        await InitializeAsync();
        if (_browser == null) throw new InvalidOperationException("Browser not initialized.");

        var random = new Random();
        var userAgent = _userAgents[random.Next(_userAgents.Length)];
        var viewport = _viewports[random.Next(_viewports.Length)];

        var contextOptions = new BrowserNewContextOptions
        {
            UserAgent = userAgent,
            ViewportSize = viewport,
            Locale = "tr-TR",
            TimezoneId = "Europe/Istanbul",
            ColorScheme = ColorScheme.Dark,
            HasTouch = false
        };

        if (File.Exists(SessionStatePath))
        {
            _logger.LogInformation("Found existing session state. Reusing session.");
            contextOptions.StorageStatePath = SessionStatePath;
        }

        // Ensuring that context is properly disposed to avoid memory leaks
        await using var context = await _browser.NewContextAsync(contextOptions);
        
        // Stealth Plugin equivalent: inject scripts to bypass bot detection
        string platform = userAgent.Contains("Macintosh") ? "MacIntel" : "Win32";
        await context.AddInitScriptAsync($@"
            Object.defineProperty(navigator, 'webdriver', {{ get: () => undefined }});
            window.chrome = {{ runtime: {{}} }};
            Object.defineProperty(navigator, 'languages', {{ get: () => ['tr-TR', 'tr', 'en-US', 'en'] }});
            Object.defineProperty(navigator, 'plugins', {{ get: () => [1, 2, 3, 4, 5] }});
            Object.defineProperty(navigator, 'platform', {{ get: () => '{platform}' }});
            
            // Override permissions API to pretend we can prompt for notifications
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
              parameters.name === 'notifications' ?
                Promise.resolve({{ state: Notification.permission }}) :
                originalQuery(parameters)
            );
        ");

        var page = await context.NewPageAsync();

        // Handle unexpected dialogs (popups) by dismissing them automatically to prevent hanging
        page.Dialog += async (_, dialog) => 
        {
            _logger.LogInformation("Dismissed unexpected dialog: {Message}", dialog.Message);
            await dialog.DismissAsync();
        };

        _logger.LogInformation("Navigating to URL: {Url}", url);
        
        // Custom Wait Strategy: Wait for NetworkIdle instead of just DOMContentLoaded
        var response = await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle, Timeout = 45000 });
        
        if (response == null) throw new Exception("Response is null.");
        
        if (response.Status == 403 || response.Status == 429)
        {
            throw new Exception($"Blocked by server with status {response.Status}. Possible Cloudflare ban.");
        }

        // Simulate Human Interaction
        _logger.LogInformation("Simulating human interaction...");
        
        // Custom Wait Strategy: Add intentional human delay before any interaction
        await page.WaitForTimeoutAsync(random.Next(1500, 3500));
        
        // Random Biometric Mouse Moves (Bezier Curves with Dynamic Speed)
        int currentX = random.Next(10, viewport.Width / 2);
        int currentY = random.Next(10, viewport.Height / 2);
        await page.Mouse.MoveAsync(currentX, currentY); // Initial jump
        await page.WaitForTimeoutAsync(random.Next(500, 1500));

        int targetX = random.Next(100, viewport.Width - 100);
        int targetY = random.Next(100, viewport.Height - 100);
        
        // Calculate Euclidean distance to determine steps (distance / 5 gives smooth dynamic speed)
        double distance = Math.Sqrt(Math.Pow(targetX - currentX, 2) + Math.Pow(targetY - currentY, 2));
        int dynamicSteps = Math.Max(15, (int)(distance / 5));
        
        await MoveMouseBiometricAsync(page, currentX, currentY, targetX, targetY, dynamicSteps);
        
        // Mouse Wheel Scroll down to trigger lazy loading
        for (int i = 0; i < 3; i++)
        {
            await page.Mouse.WheelAsync(0, random.Next(300, 800));
            await page.WaitForTimeoutAsync(random.Next(800, 2000));
        }

        // Wait for potential Cloudflare Turnstile to pass
        var title = await page.TitleAsync();
        if (title.Contains("Just a moment", StringComparison.OrdinalIgnoreCase) || 
            title.Contains("Cloudflare", StringComparison.OrdinalIgnoreCase) ||
            title.Contains("Dogrulama", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Detected Cloudflare Challenge page. Waiting longer...");
            await page.WaitForTimeoutAsync(8000); // Wait for challenge to resolve
            title = await page.TitleAsync();
            if (title.Contains("Just a moment", StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("Stuck on Cloudflare challenge page.");
            }
        }

        // Wait a bit more for dynamic content to settle
        await page.WaitForTimeoutAsync(random.Next(1000, 2500));
        
        // Save session state to bypass challenges on next requests
        await context.StorageStateAsync(new BrowserContextStorageStateOptions { Path = SessionStatePath });

        var html = await page.ContentAsync();
        return html;
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
