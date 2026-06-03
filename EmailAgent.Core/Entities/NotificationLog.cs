using System;
using System.ComponentModel.DataAnnotations;

namespace EmailAgent.Core.Entities;

public class NotificationLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string Message { get; set; } = string.Empty;

    /// <summary>PriceDrop | StockAlert | CategoryDeal | Reminder | MorningBriefing</summary>
    public string Type { get; set; } = "PriceDrop";

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
