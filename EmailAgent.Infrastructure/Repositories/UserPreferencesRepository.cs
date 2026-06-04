using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.Infrastructure.Repositories;

public class UserPreferencesRepository : IUserPreferencesRepository
{
    private readonly EmailAgentDbContext _context;
    private readonly IDataProtector _protector;

    public UserPreferencesRepository(EmailAgentDbContext context, IDataProtectionProvider protectionProvider)
    {
        _context = context;
        _protector = protectionProvider.CreateProtector("EmailAgent.ApiKeyProtector");
    }

    private UserPreferences? Decrypt(UserPreferences? user)
    {
        if (user != null && !string.IsNullOrWhiteSpace(user.ApiKey))
        {
            try
            {
                user.ApiKey = _protector.Unprotect(user.ApiKey);
            }
            catch
            {
                // If it wasn't encrypted (legacy data) or key changed, keep original or handle gracefully
                // For now, we just swallow to not crash on legacy plaintext keys.
            }
        }
        return user;
    }

    private IEnumerable<UserPreferences> DecryptAll(IEnumerable<UserPreferences> users)
    {
        foreach (var user in users)
        {
            Decrypt(user);
        }
        return users;
    }

    public async Task<IEnumerable<UserPreferences>> GetAllAsync()
    {
        var users = await _context.UserPreferences.ToListAsync();
        return DecryptAll(users);
    }

    public async Task<UserPreferences?> GetByIdAsync(Guid userId)
    {
        var user = await _context.UserPreferences.FindAsync(userId);
        return Decrypt(user);
    }

    public async Task<UserPreferences?> GetByTelegramChatIdAsync(string chatId)
    {
        var user = await _context.UserPreferences.FirstOrDefaultAsync(u => u.TelegramChatId == chatId);
        return Decrypt(user);
    }

    public async Task<UserPreferences?> GetByPairingCodeAsync(string code)
    {
        var user = await _context.UserPreferences.FirstOrDefaultAsync(u => u.PairingCode == code);
        return Decrypt(user);
    }

    public async Task<UserPreferences?> GetByWhatsAppNumberAsync(string whatsAppTo)
    {
        var user = await _context.UserPreferences.FirstOrDefaultAsync(u => u.WhatsAppTo == whatsAppTo || u.WhatsAppTo == whatsAppTo.Replace("whatsapp:", ""));
        return Decrypt(user);
    }

    public async Task SaveAsync(UserPreferences preferences)
    {
        // Encrypt the incoming ApiKey before saving
        string encryptedKey = string.IsNullOrWhiteSpace(preferences.ApiKey) ? string.Empty : _protector.Protect(preferences.ApiKey);

        var existing = await _context.UserPreferences.FindAsync(preferences.Id);
        if (existing == null)
        {
            // Set the encrypted key on the new entity
            preferences.ApiKey = encryptedKey;
            await _context.UserPreferences.AddAsync(preferences);
        }
        else
        {
            existing.AiProvider = preferences.AiProvider;
            existing.ApiKey = encryptedKey;
            existing.FocusCompanies = preferences.FocusCompanies;
            existing.Keywords = preferences.Keywords;
            existing.WhatsAppSid = preferences.WhatsAppSid;
            existing.WhatsAppToken = preferences.WhatsAppToken;
            existing.WhatsAppFrom = preferences.WhatsAppFrom;
            existing.WhatsAppTo = preferences.WhatsAppTo;
            existing.TelegramBotToken = preferences.TelegramBotToken;
            existing.ShoppingTrackerIntervalHours = preferences.ShoppingTrackerIntervalHours > 0 ? preferences.ShoppingTrackerIntervalHours : 12;
            existing.AssistantPersona = preferences.AssistantPersona;
            existing.EnableEmailFeature = preferences.EnableEmailFeature;
            existing.EnableShoppingFeature = preferences.EnableShoppingFeature;
            existing.EnableFinanceFeature = preferences.EnableFinanceFeature;
            existing.EnableWebSearchFeature = preferences.EnableWebSearchFeature;
            existing.EnableDocumentAnalysisFeature = preferences.EnableDocumentAnalysisFeature;
            existing.EnableRemindersFeature = preferences.EnableRemindersFeature;
            
            _context.UserPreferences.Update(existing);
        }
        await _context.SaveChangesAsync();
        
        // Restore plaintext key to the object in memory after saving to avoid breaking calling code
        if (!string.IsNullOrWhiteSpace(encryptedKey))
        {
            try { preferences.ApiKey = _protector.Unprotect(encryptedKey); } catch {}
        }
    }
}
