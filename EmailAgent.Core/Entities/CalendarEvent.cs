using System;

namespace EmailAgent.Core.Entities;

public class CalendarEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public bool IsCompleted { get; set; } = false;
    public string? GoogleEventId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
