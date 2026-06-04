using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using EmailAgent.Core.Entities;

namespace EmailAgent.Infrastructure.GoogleCalendar;

public class GoogleCalendarService : IGoogleCalendarService
{
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleCalendarService> _logger;
    private const string ApplicationName = "EmailAgent";
    private static readonly string[] Scopes = { 
        CalendarService.Scope.CalendarEvents 
    };

    public GoogleCalendarService(IConfiguration config, ILogger<GoogleCalendarService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private CalendarService GetCalendarService(UserPreferences user)
    {
        try
        {
            if (string.IsNullOrEmpty(user.GoogleAccessToken))
            {
                throw new InvalidOperationException("User has not linked their Google account. Missing GoogleAccessToken.");
            }

            var clientId = _config["Google:ClientId"];
            var clientSecret = _config["Google:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new InvalidOperationException("Google:ClientId or Google:ClientSecret is missing from server configuration.");
            }

            var tokenResponse = new TokenResponse
            {
                AccessToken = user.GoogleAccessToken,
                RefreshToken = user.GoogleRefreshToken,
                ExpiresInSeconds = user.GoogleTokenExpiry.HasValue ? (long)(user.GoogleTokenExpiry.Value - DateTimeOffset.UtcNow).TotalSeconds : 3600,
                IssuedUtc = DateTime.UtcNow
            };

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret
                },
                Scopes = Scopes
            });

            var credential = new UserCredential(flow, user.Id.ToString(), tokenResponse);

            return new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = ApplicationName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Google Calendar API service with User Token.");
            throw;
        }
    }

    public async Task<IEnumerable<CalendarEvent>> GetUpcomingEventsAsync(UserPreferences user, DateTime start, DateTime end, CancellationToken cancellationToken = default)
    {
        var localEvents = new List<CalendarEvent>();
        
        try
        {
            if (string.IsNullOrEmpty(user.GoogleAccessToken))
            {
                // Not authenticated with Google
                return localEvents;
            }

            var service = GetCalendarService(user);
            var request = service.Events.List("primary");
            request.TimeMinDateTimeOffset = start;
            request.TimeMaxDateTimeOffset = end;
            request.ShowDeleted = false;
            request.SingleEvents = true;
            request.MaxResults = 100;
            request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;

            var events = await request.ExecuteAsync(cancellationToken);
            if (events.Items != null && events.Items.Count > 0)
            {
                foreach (var eventItem in events.Items)
                {
                    DateTime parsedDate;
                    if (eventItem.Start.DateTimeDateTimeOffset.HasValue)
                    {
                        parsedDate = eventItem.Start.DateTimeDateTimeOffset.Value.UtcDateTime;
                    }
                    else if (!string.IsNullOrEmpty(eventItem.Start.Date))
                    {
                        DateTime.TryParse(eventItem.Start.Date, out parsedDate);
                    }
                    else
                    {
                        continue;
                    }
                    
                    localEvents.Add(new CalendarEvent
                        {
                            Id = Guid.NewGuid(), // Temporary ID for merged view
                            UserId = user.Id,
                            Title = eventItem.Summary ?? "No Title",
                            Description = eventItem.Description ?? "",
                            EventDate = parsedDate,
                            IsCompleted = false,
                            GoogleEventId = eventItem.Id,
                            CreatedAt = DateTime.UtcNow
                        });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch events from Google Calendar.");
        }

        return localEvents;
    }

    public async Task<string> AddEventAsync(UserPreferences user, CalendarEvent localEvent, CancellationToken cancellationToken = default)
    {
        try
        {
            var service = GetCalendarService(user);
            var newEvent = new Event
            {
                Summary = localEvent.Title,
                Description = localEvent.Description,
                Start = new EventDateTime
                {
                    DateTimeDateTimeOffset = localEvent.EventDate,
                },
                End = new EventDateTime
                {
                    DateTimeDateTimeOffset = localEvent.EventDate.AddHours(1),
                }
            };

            var request = service.Events.Insert(newEvent, "primary");
            var createdEvent = await request.ExecuteAsync(cancellationToken);
            
            return createdEvent.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add event to Google Calendar.");
            throw;
        }
    }

    public async Task DeleteEventAsync(UserPreferences user, string googleEventId, CancellationToken cancellationToken = default)
    {
        try
        {
            var service = GetCalendarService(user);
            var request = service.Events.Delete("primary", googleEventId);
            await request.ExecuteAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete event from Google Calendar.");
            throw;
        }
    }
}
