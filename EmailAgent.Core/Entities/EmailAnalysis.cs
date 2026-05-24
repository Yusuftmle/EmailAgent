using System;

namespace EmailAgent.Core.Entities;

public class EmailAnalysis
{
    public int Id { get; set; }
    public string GmailId { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string DraftReply { get; set; } = string.Empty;
    public string Importance { get; set; } = "normal"; // "important", "normal", "spam"
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
