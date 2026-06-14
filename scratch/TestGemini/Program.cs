using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using EmailAgent.Infrastructure.Services;

var loggerFactory = LoggerFactory.Create(builder => 
{
    builder.AddConsole().SetMinimumLevel(LogLevel.Information);
});

var logger = loggerFactory.CreateLogger<PlaywrightScraperService>();
var scraper = new PlaywrightScraperService(logger);

try
{
    Console.WriteLine("Starting direct URL scraping test (GetHtmlAsync) against kleinanzeigen.de...");
    
    // Direct category/search URL on Kleinanzeigen
    var targetUrl = "https://www.kleinanzeigen.de/s-autos/golf/c216";

    var html = await scraper.GetHtmlAsync(targetUrl);
    
    Console.WriteLine($"\nSUCCESS! Extracted page HTML length: {html.Length}");
    
    // Save output to verification file
    await File.WriteAllTextAsync("scraped_page.html", html);
    Console.WriteLine("Scraped page content saved to scraped_page.html");
}
catch (Exception ex)
{
    Console.WriteLine($"\nSCRAPER TEST FAILED: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
    }
}
finally
{
    await scraper.DisposeAsync();
}
