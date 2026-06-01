using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Agent;
using EmailAgent.Infrastructure.Gmail;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EmailAgent.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EmailsController : ControllerBase
{
    private readonly IEmailAnalysisRepository _emailRepo;
    private readonly IUserPreferencesRepository _prefRepo;
    private readonly IEmailAnalysisAgent _analysisAgent;
    private readonly ILogger<EmailsController> _logger;

    public EmailsController(
        IEmailAnalysisRepository emailRepo,
        IUserPreferencesRepository prefRepo,
        IEmailAnalysisAgent analysisAgent,
        ILogger<EmailsController> logger)
    {
        _emailRepo = emailRepo;
        _prefRepo = prefRepo;
        _analysisAgent = analysisAgent;
        _logger = logger;
    }

    [HttpGet("daily-summary")]
    public async Task<ActionResult<IEnumerable<EmailAnalysis>>> GetDailySummary()
    {
        try
        {
            var today = DateTime.UtcNow;
            _logger.LogInformation("GET api/emails/daily-summary requested for: {Today:yyyy-MM-dd}", today);
            
            var emails = await _emailRepo.GetDailySummaryAsync(today);
            var emailList = new List<EmailAnalysis>(emails);
            if (emailList.Count == 0)
            {
                _logger.LogInformation("No emails found for today. Falling back to all analyzed emails.");
                var allEmails = await _emailRepo.GetAllAsync();
                return Ok(allEmails);
            }
            return Ok(emailList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve daily email summary.");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmailAnalysis>> GetById(int id)
    {
        try
        {
            _logger.LogInformation("GET api/emails/{Id} requested", id);
            
            var email = await _emailRepo.GetByIdAsync(id);
            if (email == null)
            {
                return NotFound($"Email analysis with ID {id} not found.");
            }
            return Ok(email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve email analysis ID: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id:int}/draft")]
    public async Task<ActionResult<EmailAnalysis>> RegenerateDraftReply(int id)
    {
        try
        {
            _logger.LogInformation("POST api/emails/{Id}/draft requested (Regenerate)", id);
            
            var emailAnalysis = await _emailRepo.GetByIdAsync(id);
            if (emailAnalysis == null)
            {
                return NotFound($"Email analysis with ID {id} not found.");
            }

            // Create temporary EmailMessage context to feed to LLM agent
            var tempMessage = new EmailMessage
            {
                Id = emailAnalysis.GmailId,
                From = emailAnalysis.From,
                Subject = emailAnalysis.Subject,
                // We use the generated Summary as the body to regenerate the draft if the full body is not stored
                Body = $"[Context Summary]: {emailAnalysis.Summary}"
            };

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                return Unauthorized();

            var userPrefs = await _prefRepo.GetByIdAsync(userId);
            if (userPrefs == null)
                return BadRequest("User preferences not found.");

            _logger.LogInformation("Regenerating AI Draft for email ID: {Id} for User {UserId}", id, userId);
            
            var newDraft = await _analysisAgent.DraftReplyAsync(tempMessage, userPrefs);
            emailAnalysis.DraftReply = newDraft;
            await _emailRepo.UpdateAsync(emailAnalysis);
            await _emailRepo.SaveChangesAsync();

            _logger.LogInformation("Successfully regenerated draft reply for ID: {Id}", id);
            return Ok(emailAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to regenerate draft for email ID: {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
