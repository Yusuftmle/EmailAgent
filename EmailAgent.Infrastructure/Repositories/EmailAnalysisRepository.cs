using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.Infrastructure.Repositories;

public class EmailAnalysisRepository : IEmailAnalysisRepository
{
    private readonly EmailAgentDbContext _context;

    public EmailAnalysisRepository(EmailAgentDbContext context)
    {
        _context = context;
    }

    public async Task<EmailAnalysis?> GetByIdAsync(int id)
    {
        return await _context.EmailAnalyses.FindAsync(id);
    }

    public async Task<EmailAnalysis?> GetByGmailIdAsync(string gmailId)
    {
        return await _context.EmailAnalyses
            .FirstOrDefaultAsync(e => e.GmailId == gmailId);
    }

    public async Task<IEnumerable<EmailAnalysis>> GetDailySummaryAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);
        return await _context.EmailAnalyses
            .Where(e => e.ProcessedAt >= startOfDay && e.ProcessedAt < endOfDay)
            .OrderByDescending(e => e.ProcessedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<EmailAnalysis>> GetAllAsync()
    {
        return await _context.EmailAnalyses
            .OrderByDescending(e => e.ProcessedAt)
            .ToListAsync();
    }

    public async Task AddAsync(EmailAnalysis analysis)
    {
        await _context.EmailAnalyses.AddAsync(analysis);
    }

    public async Task UpdateAsync(EmailAnalysis analysis)
    {
        _context.EmailAnalyses.Update(analysis);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
