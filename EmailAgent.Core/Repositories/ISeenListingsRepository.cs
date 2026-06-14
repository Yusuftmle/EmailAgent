using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Core.Repositories;

public interface ISeenListingsRepository
{
    Task<List<SeenListing>> GetSeenListingsAsync(Guid userId, Guid categoryId);
    Task UpsertSeenListingAsync(SeenListing listing);
}
