using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Gmail;
using EmailAgent.Infrastructure.Notifications;
using EmailAgent.Agent;

namespace EmailAgent.Infrastructure.Jobs;

public class DailyEmailJob
{
    private readonly IGmailService _gmailService;
    private readonly IEmailAnalysisAgent _analysisAgent;
    private readonly IEmailAnalysisRepository _emailRepo;
    private readonly IUserPreferencesRepository _prefRepo;
    private readonly ITelegramNotificationService _telegramService;
    private readonly IWhatsAppNotificationService _whatsAppService;
    private readonly IConfiguration _config;
    private readonly ILogger<DailyEmailJob> _logger;

    public DailyEmailJob(
        IGmailService gmailService,
        IEmailAnalysisAgent analysisAgent,
        IEmailAnalysisRepository emailRepo,
        IUserPreferencesRepository prefRepo,
        ITelegramNotificationService telegramService,
        IWhatsAppNotificationService whatsAppService,
        IConfiguration config,
        ILogger<DailyEmailJob> logger)
    {
        _gmailService = gmailService;
        _analysisAgent = analysisAgent;
        _emailRepo = emailRepo;
        _prefRepo = prefRepo;
        _telegramService = telegramService;
        _whatsAppService = whatsAppService;
        _config = config;
        _logger = logger;
    }

    public async Task RunDailyAnalysisAsync()
    {
        _logger.LogInformation("Hangfire Job: starting email analysis background pipeline...");
        
        try
        {
            // 1. Fetch all user preferences
            var users = await _prefRepo.GetAllAsync();

            foreach (var preferences in users)
            {
                try
                {
                    _logger.LogInformation("Processing emails for User {UserId}...", preferences.Id);
                    
                    // 2. Fetch unread emails from Gmail
                    var unreadEmails = await _gmailService.FetchUnreadEmailsLast24HoursAsync(preferences, CancellationToken.None);
                    var emailMessages = unreadEmails.ToList();

                    if (!emailMessages.Any())
                    {
                        _logger.LogInformation("No new emails retrieved from Gmail for User {UserId}.", preferences.Id);
                        continue;
                    }

                int newImportantCount = 0;
                int newProcessedCount = 0;

                _logger.LogInformation("Retrieved {Count} emails for processing for User {UserId}.", emailMessages.Count, preferences.Id);

                foreach (var email in emailMessages)
            {
                try
                {
                    // Prevent duplicate processing
                    var existing = await _emailRepo.GetByGmailIdAsync(email.Id);
                    bool isUpdate = false;
                    if (existing != null)
                    {
                        if ((existing.Summary != null && existing.Summary.Contains("error", StringComparison.OrdinalIgnoreCase)) || 
                            (existing.DraftReply != null && existing.DraftReply.Contains("error", StringComparison.OrdinalIgnoreCase)) ||
                            string.IsNullOrEmpty(existing.Summary) ||
                            existing.Summary == "Failed to generate summary.")
                        {
                            _logger.LogInformation("Email with Gmail ID {Id} has failed/incomplete analysis in DB. Re-analyzing and updating.", email.Id);
                            isUpdate = true;
                        }
                        else
                        {
                            _logger.LogInformation("Email with Gmail ID {Id} was already processed successfully. Skipping.", email.Id);
                            continue;
                        }
                    }

                    // Run Semantic Kernel Analysis pipeline sequentially to prevent hitting Gemini API 429 Rate Limits
                    _logger.LogInformation("Analyzing email ID: {Id} - Classifying...", email.Id);
                    var importance = await _analysisAgent.ClassifyEmailAsync(email, preferences);
                    await Task.Delay(1500);

                    string summary = "Önemsiz olarak sınıflandırıldı. (Token tasarrufu için özetleme atlandı)";
                    string draftReply = "";

                    if (importance == "important")
                    {
                        _logger.LogInformation("Analyzing email ID: {Id} - Summarizing...", email.Id);
                        summary = await _analysisAgent.SummarizeEmailAsync(email, preferences);
                        await Task.Delay(1500);

                        _logger.LogInformation("Analyzing email ID: {Id} - Drafting reply...", email.Id);
                        draftReply = await _analysisAgent.DraftReplyAsync(email, preferences);
                        await Task.Delay(1500);
                    }
                    else
                    {
                        _logger.LogInformation("Email ID: {Id} is not important. Skipping summary and draft to save tokens.", email.Id);
                    }

                    if (isUpdate && existing != null)
                    {
                        existing.Summary = summary;
                        existing.DraftReply = draftReply;
                        existing.Importance = importance;
                        existing.ProcessedAt = DateTime.UtcNow;
                        await _emailRepo.UpdateAsync(existing);
                    }
                    else
                    {
                        var analysis = new EmailAnalysis
                        {
                            GmailId = email.Id,
                            From = email.From,
                            Subject = email.Subject,
                            Summary = summary,
                            DraftReply = draftReply,
                            Importance = importance,
                            ProcessedAt = DateTime.UtcNow
                        };
                        await _emailRepo.AddAsync(analysis);
                    }
                    newProcessedCount++;

                    if (importance == "important")
                    {
                        newImportantCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to analyze and record email ID: {Id}", email.Id);
                }
            }

                if (newProcessedCount > 0)
                {
                    await _emailRepo.SaveChangesAsync();
                    _logger.LogInformation("Successfully analyzed and saved {Count} new emails in PostgreSQL database for User {UserId}.", newProcessedCount, preferences.Id);
                }

                // 3. Send out summary notifications if new emails were processed
                var dashboardUrl = _config["App:DashboardUrl"] ?? "http://localhost:5173";
                
                if (newImportantCount > 0)
                {
                    _logger.LogInformation("Triggering system notifications. Important emails found: {Count}", newImportantCount);
                    
                    var telegramTask = _telegramService.SendDailySummaryAsync(preferences, newImportantCount, dashboardUrl, CancellationToken.None);
                    var whatsappTask = _whatsAppService.SendDailySummaryAsync(preferences, newImportantCount, dashboardUrl);

                    await Task.WhenAll(telegramTask, whatsappTask);
                }
                else
                {
                    _logger.LogInformation("No important emails found for User {UserId}. Skipping notifications.", preferences.Id);
                }
                }
                catch (Exception userEx)
                {
                    _logger.LogError(userEx, "Failed to process daily summary for User {UserId}. Skipping to next user.", preferences.Id);
                    continue;
                }
            } // end foreach user

            _logger.LogInformation("Daily Email analysis job finished successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Critical failure in DailyEmailJob pipeline execution.");
            throw;
        }
    }
}
