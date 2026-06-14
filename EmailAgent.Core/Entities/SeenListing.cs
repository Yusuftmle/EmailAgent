using System;

namespace EmailAgent.Core.Entities;

public class SeenListing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    
    /// <summary>
    /// Product ID or URL Hash extracted from the website
    /// </summary>
    public string ListingIdentifier { get; set; } = string.Empty;
    
    public decimal LastSeenPrice { get; set; }
    public DateTimeOffset FirstSeenAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastSeenAt { get; set; } = DateTimeOffset.UtcNow;
}
