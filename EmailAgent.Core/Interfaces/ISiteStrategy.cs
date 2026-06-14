using EmailAgent.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmailAgent.Core.Interfaces;

public interface ISiteStrategy
{
    bool CanHandle(string url);
    Task<string> FetchHtmlAsync(string url);
    Task<(decimal? Price, string? Currency, string? Title, string? ImageUrl, bool IsInStock)> ParseProductAsync(string url, string html);
    Task<List<CategoryDeal>> ParseCategoryDealsAsync(string categoryUrl, string html, decimal minDiscount);
}
