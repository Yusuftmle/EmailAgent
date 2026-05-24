using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Core.Repositories;

public interface IUserPreferencesRepository
{
    Task<UserPreferences?> GetAsync();
    Task SaveAsync(UserPreferences preferences);
}
