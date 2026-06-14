using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Core.Interfaces;

public interface IStrategyDefinitionRepository
{
    Task<SiteStrategyDefinition?> GetByDomainAsync(string domain);
    Task SaveAsync(SiteStrategyDefinition definition);
    Task UpdateAsync(SiteStrategyDefinition definition);
}
