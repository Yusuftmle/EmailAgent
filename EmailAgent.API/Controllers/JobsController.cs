using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Hangfire;
using EmailAgent.Infrastructure.Jobs;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<JobsController> _logger;

    public JobsController(IBackgroundJobClient backgroundJobClient, ILogger<JobsController> logger)
    {
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    [HttpPost("run-now")]
    public IActionResult TriggerJobNow()
    {
        _logger.LogInformation("POST api/jobs/run-now: Manual trigger requested");
        
        var jobId = _backgroundJobClient.Enqueue<DailyEmailJob>(
            job => job.RunDailyAnalysisAsync()
        );

        _logger.LogInformation("Enqueued DailyEmailJob in Hangfire with JobId: {JobId}", jobId);
        
        return Accepted(new { JobId = jobId, Message = "Email analysis job triggered successfully." });
    }

    [HttpPost("run-shopping")]
    public IActionResult TriggerShoppingJobNow()
    {
        _logger.LogInformation("POST api/jobs/run-shopping: Manual trigger requested");
        
        var jobId = _backgroundJobClient.Enqueue<ShoppingTrackerJob>(
            job => job.CheckPricesAsync()
        );

        _logger.LogInformation("Enqueued ShoppingTrackerJob in Hangfire with JobId: {JobId}", jobId);
        
        return Accepted(new { JobId = jobId, Message = "Shopping tracker job triggered successfully." });
    }
}
