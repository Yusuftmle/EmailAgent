using System;
using System.ComponentModel.DataAnnotations;

namespace EmailAgent.Core.Entities;

public class PriceHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProductId { get; set; }

    public decimal Price { get; set; }

    public bool IsInStock { get; set; } = true;

    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}
