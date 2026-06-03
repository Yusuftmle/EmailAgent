using System;

namespace EmailAgent.Core.Entities;

public class TrackedCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    
    // Example: "https://www.amazon.de/s?k=gaming+laptop"
    public string CategoryUrl { get; set; } = string.Empty;
    
    // User-friendly name e.g. "Gaming Laptops"
    public string CategoryName { get; set; } = string.Empty;
    
    public decimal MinDiscountPercentage { get; set; } = 15;
    
    public string? RequiredFeatures { get; set; }
    
    // Optional Guid to group multiple categories together for cross-border comparison
    public Guid? ComparisonGroupId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastCheckedAt { get; set; }
}
