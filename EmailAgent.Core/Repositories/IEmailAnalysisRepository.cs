using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Core.Repositories;

public interface IEmailAnalysisRepository
{
    Task<EmailAnalysis?> GetByIdAsync(int id);
    Task<EmailAnalysis?> GetByGmailIdAsync(string gmailId);
    Task<IEnumerable<EmailAnalysis>> GetDailySummaryAsync(DateTime date);
    Task<IEnumerable<EmailAnalysis>> GetAllAsync();
    Task AddAsync(EmailAnalysis analysis);
    Task UpdateAsync(EmailAnalysis analysis);
    Task SaveChangesAsync();
}
