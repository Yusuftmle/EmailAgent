using System;
using System.ComponentModel.DataAnnotations;

namespace EmailAgent.Core.Entities;

public class TrackedProduct
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public string Url { get; set; } = string.Empty;
    
    public string Title { get; set; } = string.Empty;
    
    public decimal TargetPrice { get; set; }
    
    public decimal LastKnownPrice { get; set; }
    
    public decimal? LastNotifiedPrice { get; set; }
    
    public string Currency { get; set; } = "EUR";
    
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    
    public DateTimeOffset LastCheckedAt { get; set; } = DateTimeOffset.UtcNow;
    
    public bool IsInStock { get; set; } = true;
    
    public bool IsActive { get; set; } = true;
}
