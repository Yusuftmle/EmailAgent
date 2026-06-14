using Microsoft.Playwright;
using System.Threading.Tasks;

namespace EmailAgent.Infrastructure.Scraping.Interfaces;

public interface IBrowserProvider
{
    Task<IBrowser> GetBrowserAsync();
    Task<IPage> NewPageAsync();
}
