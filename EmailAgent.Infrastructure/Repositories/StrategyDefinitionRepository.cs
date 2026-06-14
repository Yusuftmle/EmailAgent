using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Interfaces;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.Infrastructure.Repositories;

public class StrategyDefinitionRepository : IStrategyDefinitionRepository
{
    private readonly EmailAgentDbContext _context;

    public StrategyDefinitionRepository(EmailAgentDbContext context)
    {
        _context = context;
    }

    public async Task<SiteStrategyDefinition?> GetByDomainAsync(string domain)
    {
        return await _context.SiteStrategyDefinitions
            .FirstOrDefaultAsync(s => s.Domain == domain);
    }

    public async Task SaveAsync(SiteStrategyDefinition definition)
    {
        var existing = await GetByDomainAsync(definition.Domain);
        if (existing != null)
        {
            existing.FetchMethod = definition.FetchMethod;
            existing.PriceSelector = definition.PriceSelector;
            existing.TitleSelector = definition.TitleSelector;
            existing.StockSelector = definition.StockSelector;
            existing.Confidence = definition.Confidence;
            existing.LastVerifiedAt = DateTimeOffset.UtcNow;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            _context.SiteStrategyDefinitions.Add(definition);
        }
        
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(SiteStrategyDefinition definition)
    {
        definition.UpdatedAt = DateTimeOffset.UtcNow;
        _context.SiteStrategyDefinitions.Update(definition);
        await _context.SaveChangesAsync();
    }
}
