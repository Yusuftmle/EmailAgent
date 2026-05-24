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

    public async Task<UserPreferences?> GetAsync()
    {
        // Get the first preferences or return null
        return await _context.UserPreferences.FirstOrDefaultAsync();
    }

    public async Task SaveAsync(UserPreferences preferences)
    {
        var existing = await _context.UserPreferences.FirstOrDefaultAsync();
        if (existing == null)
        {
            await _context.UserPreferences.AddAsync(preferences);
        }
        else
        {
            existing.UserEmail = preferences.UserEmail;
            existing.AiProvider = preferences.AiProvider;
            existing.ApiKey = preferences.ApiKey;
            existing.FocusCompanies = preferences.FocusCompanies;
            existing.Keywords = preferences.Keywords;
            existing.WhatsAppSid = preferences.WhatsAppSid;
            existing.WhatsAppToken = preferences.WhatsAppToken;
            existing.WhatsAppFrom = preferences.WhatsAppFrom;
            existing.WhatsAppTo = preferences.WhatsAppTo;
            _context.UserPreferences.Update(existing);
        }
        await _context.SaveChangesAsync();
    }
}
