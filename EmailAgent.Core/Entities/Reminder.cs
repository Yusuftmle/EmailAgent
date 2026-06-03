using System;
using System.ComponentModel.DataAnnotations;

namespace EmailAgent.Core.Entities;

public class Reminder
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string Message { get; set; } = string.Empty;

    public DateTime RemindAt { get; set; }

    public bool IsSent { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
