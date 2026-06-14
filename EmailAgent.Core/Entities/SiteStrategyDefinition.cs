using System;

namespace EmailAgent.Core.Entities;

public class SiteStrategyDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Domain { get; set; } = string.Empty;
    
    // e.g., "Playwright", "ScraperAPI"
    public string FetchMethod { get; set; } = "Playwright";
    
    public string? PriceSelector { get; set; }
    public string? TitleSelector { get; set; }
    public string? StockSelector { get; set; }
    public string? ImageSelector { get; set; }
    
    // Confidence score (0.0 to 1.0)
    public double Confidence { get; set; } = 1.0;
    
    public DateTimeOffset LastVerifiedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
