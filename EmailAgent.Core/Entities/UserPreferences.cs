using System.Collections.Generic;

namespace EmailAgent.Core.Entities;

public class UserPreferences
{
    public int Id { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string AiProvider { get; set; } = "Claude"; // "Claude", "Gemini", "OpenAI"
    public string ApiKey { get; set; } = string.Empty;
    public List<string> FocusCompanies { get; set; } = new();
    public List<string> Keywords { get; set; } = new();

    // WhatsApp Notification Configuration (Twilio API credentials)
    public string WhatsAppSid { get; set; } = string.Empty;
    public string WhatsAppToken { get; set; } = string.Empty;
    public string WhatsAppFrom { get; set; } = string.Empty;
    public string WhatsAppTo { get; set; } = string.Empty;
}
