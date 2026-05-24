using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;

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

    [HttpGet]
    public async Task<ActionResult<UserPreferences>> GetPreferences()
    {
        try
        {
            _logger.LogInformation("GET api/preferences requested");
            
            var prefs = await _prefRepo.GetAsync();
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

    [HttpPost]
    public async Task<ActionResult<UserPreferences>> SavePreferences([FromBody] UserPreferences preferences)
    {
        if (preferences == null)
        {
            return BadRequest("Preferences data cannot be null.");
        }

        try
        {
            _logger.LogInformation("POST api/preferences requested (Save)");
            
            await _prefRepo.SaveAsync(preferences);
            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save user preferences.");
            return StatusCode(500, "Internal server error");
        }
    }
}
