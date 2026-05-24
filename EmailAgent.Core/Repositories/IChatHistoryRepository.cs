using System.Collections.Generic;
using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Core.Repositories;

public interface IChatHistoryRepository
{
    Task<IEnumerable<ChatHistory>> GetSessionHistoryAsync(string sessionId);
    Task AddAsync(ChatHistory message);
    Task ClearHistoryAsync(string sessionId);
}
