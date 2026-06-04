using System;
using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using EmailAgent.Core.Entities;
using EmailAgent.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace EmailAgent.API.Plugins;

public class AgendaPlugin
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly Guid _userId;
    private readonly ILogger _logger;

    public AgendaPlugin(EmailAgentDbContext dbContext, Guid userId, ILogger<AgendaPlugin> logger)
    {
        _dbContext = dbContext;
        _userId = userId;
        _logger = logger;
    }

    [KernelFunction("add_agenda_event")]
    [Description("Adds a new event or meeting to the user's agenda/calendar. Use this when the user mentions an upcoming event, meeting, or task they want to remember or schedule.")]
    public async Task<string> AddEventAsync(
        [Description("The title or name of the event (e.g. 'Dentist Appointment', 'Project Meeting')")] string title,
        [Description("The exact date and time of the event in ISO 8601 format (e.g., '2026-06-05T15:00:00Z'). Make sure it is UTC.")] string eventDateIso,
        [Description("Optional description or details about the event")] string description = ""
    )
    {
        try
        {
            if (!DateTime.TryParse(eventDateIso, out DateTime eventDate))
            {
                return $"Error: Invalid date format '{eventDateIso}'. Please use ISO 8601 format.";
            }

            var newEvent = new CalendarEvent
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = title,
                Description = description,
                EventDate = eventDate.ToUniversalTime(),
                CreatedAt = DateTime.UtcNow,
                IsCompleted = false
            };

            _dbContext.CalendarEvents.Add(newEvent);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Added new calendar event '{Title}' for user {UserId}", title, _userId);

            return $"Success: Added '{title}' to the calendar for {eventDate.ToString("g")}.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add calendar event via AI Plugin.");
            return $"Error: Could not add event to the database. {ex.Message}";
        }
    }
}
