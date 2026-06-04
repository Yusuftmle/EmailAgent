using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EmailAgent.Core.Entities;

namespace EmailAgent.Infrastructure.GoogleCalendar;

public interface IGoogleCalendarService
{
    Task<IEnumerable<CalendarEvent>> GetUpcomingEventsAsync(UserPreferences user, DateTime start, DateTime end, CancellationToken cancellationToken = default);
    Task<string> AddEventAsync(UserPreferences user, CalendarEvent localEvent, CancellationToken cancellationToken = default);
    Task DeleteEventAsync(UserPreferences user, string googleEventId, CancellationToken cancellationToken = default);
}
