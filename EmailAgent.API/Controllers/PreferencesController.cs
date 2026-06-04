using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using System.Security.Claims;
using Hangfire;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PreferencesController : ControllerBase
{
    private readonly IUserPreferencesRepository _prefRepo;
    private readonly ILogger<PreferencesController> _logger;

    public PreferencesController(IUserPreferencesRepository prefRepo, ILogger<PreferencesController> logger)
    {
        _prefRepo = prefRepo;
        _logger = logger;
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpGet]
    public async Task<ActionResult<UserPreferences>> GetPreferences()
    {
        try
        {
            var userIdString = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                return Unauthorized();

            _logger.LogInformation("GET api/preferences requested by {UserId}", userId);
            
            var prefs = await _prefRepo.GetByIdAsync(userId);
            if (prefs == null)
            {
                // Return empty default preferences if not yet created in the database
                return Ok(new UserPreferences());
            }
            return Ok(prefs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve user preferences.");
            return StatusCode(500, "Internal server error");
        }
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost]
    public async Task<ActionResult<UserPreferences>> SavePreferences([FromBody] UserPreferences preferences)
    {
        if (preferences == null)
        {
            return BadRequest("Preferences data cannot be null.");
        }

        try
        {
            var userIdString = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                return Unauthorized();

            preferences.Id = userId;
            _logger.LogInformation("POST api/preferences requested (Save) for {UserId}", userId);
            
            await _prefRepo.SaveAsync(preferences);

            // Schedule the Morning Briefing Job dynamically for this user based on their timezone
            try
            {
                var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(preferences.Timezone ?? "Europe/Istanbul");
                RecurringJob.AddOrUpdate<EmailAgent.Infrastructure.Jobs.DailyBriefingJob>(
                    $"daily-briefing-{userId}",
                    job => job.SendMorningBriefingForUserAsync(userId),
                    "0 8 * * *", // Every day at 08:00 AM
                    new RecurringJobOptions
                    {
                        TimeZone = timeZoneInfo
                    }
                );
            }
            catch (Exception tzEx)
            {
                _logger.LogWarning(tzEx, "Failed to parse timezone {Timezone}. Using UTC.", preferences.Timezone);
                RecurringJob.AddOrUpdate<EmailAgent.Infrastructure.Jobs.DailyBriefingJob>(
                    $"daily-briefing-{userId}",
                    job => job.SendMorningBriefingForUserAsync(userId),
                    "0 8 * * *",
                    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
                );
            }

            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save user preferences.");
            return StatusCode(500, "Internal server error");
        }
    }
}
