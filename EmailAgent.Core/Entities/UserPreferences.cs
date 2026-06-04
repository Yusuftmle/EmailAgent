using System;
using System.Collections.Generic;

namespace EmailAgent.Core.Entities;

public class UserPreferences
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserEmail { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = "Istanbul";
    public string Timezone { get; set; } = "Europe/Istanbul";
    
    // AI Engine Configuration
    public string AiProvider { get; set; } = "Claude"; // "Claude", "Gemini", "OpenAI"
    public string ApiKey { get; set; } = string.Empty;
    public string AssistantPersona { get; set; } = "Sen enerjik, samimi ve motive edici bir yapay zeka asistanısın. Kullanıcıya her zaman yardımcı ol.";
    public List<string> FocusCompanies { get; set; } = new();
    public List<string> Keywords { get; set; } = new();

    // Centralized Authentication
    public string PairingCode { get; set; } = Guid.NewGuid().ToString();

    // Google OAuth (Gmail API)
    public string GoogleAccessToken { get; set; } = string.Empty;
    public string GoogleRefreshToken { get; set; } = string.Empty;
    public DateTimeOffset? GoogleTokenExpiry { get; set; }

    // WhatsApp Notifications
    public string WhatsAppSid { get; set; } = string.Empty;
    public string WhatsAppToken { get; set; } = string.Empty;
    public string WhatsAppFrom { get; set; } = string.Empty;
    public string WhatsAppTo { get; set; } = string.Empty;

    // Telegram Notifications
    public string TelegramBotToken { get; set; } = string.Empty;
    public string TelegramChatId { get; set; } = string.Empty;

    // Preferences
    public int ShoppingTrackerIntervalHours { get; set; } = 12;

    // Feature Toggles (Bot Capabilities)
    public bool EnableEmailFeature { get; set; } = true;
    public bool EnableShoppingFeature { get; set; } = true;
    public bool EnableFinanceFeature { get; set; } = true;
    public bool EnableWebSearchFeature { get; set; } = true;
    public bool EnableDocumentAnalysisFeature { get; set; } = true;
    public bool EnableRemindersFeature { get; set; } = true;
    public bool EnableCalendarFeature { get; set; } = true;
}
