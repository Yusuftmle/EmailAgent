using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Data;

namespace EmailAgent.Infrastructure.Repositories;

public class SeenListingsRepository : ISeenListingsRepository
{
    private readonly EmailAgentDbContext _context;

    public SeenListingsRepository(EmailAgentDbContext context)
    {
        _context = context;
    }

    public async Task<List<SeenListing>> GetSeenListingsAsync(Guid userId, Guid categoryId)
    {
        return await _context.SeenListings
            .Where(x => x.UserId == userId && x.CategoryId == categoryId)
            .ToListAsync();
    }

    public async Task UpsertSeenListingAsync(SeenListing listing)
    {
        var existing = await _context.SeenListings
            .FirstOrDefaultAsync(x => x.UserId == listing.UserId && x.CategoryId == listing.CategoryId && x.ListingIdentifier == listing.ListingIdentifier);

        if (existing == null)
        {
            _context.SeenListings.Add(listing);
        }
        else
        {
            existing.LastSeenPrice = listing.LastSeenPrice;
            existing.LastSeenAt = listing.LastSeenAt;
            _context.SeenListings.Update(existing);
        }
        await _context.SaveChangesAsync();
    }
}
