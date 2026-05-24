using System;

namespace EmailAgent.Core.Entities;

public class EmailMessage
{
    public string Id { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public bool IsImportant { get; set; }
}
