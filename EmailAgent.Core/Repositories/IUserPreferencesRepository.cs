using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Core.Repositories;

public interface IUserPreferencesRepository
{
    Task<System.Collections.Generic.IEnumerable<UserPreferences>> GetAllAsync();
    Task<UserPreferences?> GetByIdAsync(Guid userId);
    Task<UserPreferences?> GetByTelegramChatIdAsync(string chatId);
    Task<UserPreferences?> GetByPairingCodeAsync(string code);
    Task<UserPreferences?> GetByWhatsAppNumberAsync(string whatsAppTo);
    Task SaveAsync(UserPreferences preferences);
}
