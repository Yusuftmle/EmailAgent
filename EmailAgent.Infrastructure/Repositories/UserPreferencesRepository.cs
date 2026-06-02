using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.Infrastructure.Repositories;

public class UserPreferencesRepository : IUserPreferencesRepository
{
    private readonly EmailAgentDbContext _context;

    public UserPreferencesRepository(EmailAgentDbContext context)
    {
        _context = context;
    }

    public async Task<System.Collections.Generic.IEnumerable<UserPreferences>> GetAllAsync()
    {
        return await _context.UserPreferences.ToListAsync();
    }

    public async Task<UserPreferences?> GetByIdAsync(Guid userId)
    {
        return await _context.UserPreferences.FindAsync(userId);
    }

    public async Task<UserPreferences?> GetByTelegramChatIdAsync(string chatId)
    {
        return await _context.UserPreferences.FirstOrDefaultAsync(u => u.TelegramChatId == chatId);
    }

    public async Task<UserPreferences?> GetByPairingCodeAsync(string code)
    {
        return await _context.UserPreferences.FirstOrDefaultAsync(u => u.PairingCode == code);
    }

    public async Task<UserPreferences?> GetByWhatsAppNumberAsync(string whatsAppTo)
    {
        return await _context.UserPreferences.FirstOrDefaultAsync(u => u.WhatsAppTo == whatsAppTo || u.WhatsAppTo == whatsAppTo.Replace("whatsapp:", ""));
    }

    public async Task SaveAsync(UserPreferences preferences)
    {
        var existing = await _context.UserPreferences.FindAsync(preferences.Id);
        if (existing == null)
        {
            await _context.UserPreferences.AddAsync(preferences);
        }
        else
        {
            existing.AiProvider = preferences.AiProvider;
            existing.ApiKey = preferences.ApiKey;
            existing.FocusCompanies = preferences.FocusCompanies;
            existing.Keywords = preferences.Keywords;
            existing.WhatsAppSid = preferences.WhatsAppSid;
            existing.WhatsAppToken = preferences.WhatsAppToken;
            existing.WhatsAppFrom = preferences.WhatsAppFrom;
            existing.WhatsAppTo = preferences.WhatsAppTo;
            existing.TelegramBotToken = preferences.TelegramBotToken;
            existing.ShoppingTrackerIntervalHours = preferences.ShoppingTrackerIntervalHours > 0 ? preferences.ShoppingTrackerIntervalHours : 12;
            
            _context.UserPreferences.Update(existing);
        }
        await _context.SaveChangesAsync();
    }
}
