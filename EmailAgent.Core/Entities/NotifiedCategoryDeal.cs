using System;
using System.ComponentModel.DataAnnotations;

namespace EmailAgent.Core.Entities;

public class NotifiedCategoryDeal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid TrackedCategoryId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public string ProductUrl { get; set; } = string.Empty;
    
    [Required]
    public decimal NotifiedPrice { get; set; }
    
    public DateTimeOffset NotifiedAt { get; set; } = DateTimeOffset.UtcNow;
}
