using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.Infrastructure.Repositories;

public class ChatHistoryRepository : IChatHistoryRepository
{
    private readonly EmailAgentDbContext _context;

    public ChatHistoryRepository(EmailAgentDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ChatHistory>> GetSessionHistoryAsync(string sessionId)
    {
        return await _context.ChatHistories
            .Where(c => c.SessionId == sessionId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(ChatHistory message)
    {
        await _context.ChatHistories.AddAsync(message);
        await _context.SaveChangesAsync();
    }

    public async Task ClearHistoryAsync(string sessionId)
    {
        var history = await _context.ChatHistories
            .Where(c => c.SessionId == sessionId)
            .ToListAsync();
        
        _context.ChatHistories.RemoveRange(history);
        await _context.SaveChangesAsync();
    }
}
