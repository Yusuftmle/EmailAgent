using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmailAgent.Core.Entities;
using EmailAgent.Infrastructure.Data;
using System.Security.Claims;

using EmailAgent.Infrastructure.GoogleCalendar;

namespace EmailAgent.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CalendarController : ControllerBase
{
    private readonly EmailAgentDbContext _context;
    private readonly IGoogleCalendarService _googleCalendarService;

    public CalendarController(EmailAgentDbContext context, IGoogleCalendarService googleCalendarService)
    {
        _context = context;
        _googleCalendarService = googleCalendarService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CalendarEvent>>> GetEvents()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var user = await _context.UserPreferences.FindAsync(userId);
        if (user == null) return NotFound();

        var localEvents = await _context.CalendarEvents
            .Where(e => e.UserId == userId)
            .ToListAsync();

        try 
        {
            var googleEvents = await _googleCalendarService.GetUpcomingEventsAsync(user, DateTime.UtcNow.AddMonths(-1), DateTime.UtcNow.AddMonths(3));
            
            // Merge events - avoid duplicates by checking GoogleEventId
            foreach(var ge in googleEvents)
            {
                if (!localEvents.Any(le => le.GoogleEventId == ge.GoogleEventId))
                {
                    localEvents.Add(ge);
                }
            }
        }
        catch (Exception)
        {
            // Ignore google fetch errors and just return local if failed
        }

        return Ok(localEvents.OrderBy(e => e.EventDate));
    }

    [HttpPost]
    public async Task<ActionResult<CalendarEvent>> CreateEvent([FromBody] CalendarEvent newEvent)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var user = await _context.UserPreferences.FindAsync(userId);
        if (user == null) return NotFound();

        newEvent.Id = Guid.NewGuid();
        newEvent.UserId = userId;
        newEvent.CreatedAt = DateTime.UtcNow;

        if (user.GoogleAccessToken != null)
        {
            try 
            {
                var googleEventId = await _googleCalendarService.AddEventAsync(user, newEvent);
                newEvent.GoogleEventId = googleEventId;
            }
            catch (Exception)
            {
                // Continue to save locally even if google fails
            }
        }

        _context.CalendarEvents.Add(newEvent);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEvents), new { id = newEvent.Id }, newEvent);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] CalendarEvent updatedEvent)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var existing = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (existing == null) return NotFound();

        existing.Title = updatedEvent.Title;
        existing.Description = updatedEvent.Description;
        existing.EventDate = updatedEvent.EventDate;
        existing.IsCompleted = updatedEvent.IsCompleted;

        // NOTE: Google Calendar update is omitted for simplicity, 
        // ideally we would update it there too if existing.GoogleEventId is not null.

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var user = await _context.UserPreferences.FindAsync(userId);
        
        var existing = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (existing == null) return NotFound();

        if (user != null && !string.IsNullOrEmpty(existing.GoogleEventId))
        {
            try
            {
                await _googleCalendarService.DeleteEventAsync(user, existing.GoogleEventId);
            }
            catch (Exception)
            {
                // Ignore and delete locally
            }
        }

        _context.CalendarEvents.Remove(existing);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
