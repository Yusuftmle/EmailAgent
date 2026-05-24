using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Core.Entities;

namespace EmailAgent.Agent;

public interface IEmailAnalysisAgent
{
    Task<string> ClassifyEmailAsync(EmailMessage email, UserPreferences? preferences);
    Task<string> SummarizeEmailAsync(EmailMessage email);
    Task<string> DraftReplyAsync(EmailMessage email);
}

public class EmailAnalysisAgent : IEmailAnalysisAgent
{
    private readonly Kernel _kernel;
    private readonly ILogger<EmailAnalysisAgent> _logger;

    public EmailAnalysisAgent(Kernel kernel, ILogger<EmailAnalysisAgent> logger)
    {
        _kernel = kernel;
        _logger = logger;
    }

    public async Task<string> ClassifyEmailAsync(EmailMessage email, UserPreferences? preferences)
    {
        try
        {
            _logger.LogInformation("Classifying email from {From}, Subject: {Subject}", email.From, email.Subject);
            
            var focusCompaniesJson = preferences != null ? JsonSerializer.Serialize(preferences.FocusCompanies) : "[]";
            var keywordsJson = preferences != null ? JsonSerializer.Serialize(preferences.Keywords) : "[]";

            var prompt = $@"
You are an expert AI email coordinator. Your task is to classify the email below into one of three categories:
- 'important': The email is critical, urgent, time-sensitive, requires immediate attention (e.g. meeting requests, emergencies, important business), is from a listed focus company, or contains important keywords. Use your own intelligence to deduce urgency even if no keywords are provided.
- 'spam': Unsolicited advertising, marketing newsletters, junk, phishing, or bulk emails.
- 'normal': Standard correspondence that is not urgent, spam, or highly critical.

User preferences for key targets:
Focus Companies: {focusCompaniesJson}
Keywords / Topics: {keywordsJson}

Email to analyze:
From: {email.From}
Subject: {email.Subject}
Body:
{email.Body}

Based on the email sender, subject, and body content, return EXACTLY one word from the following options (in lowercase, no punctuation, no extra words): important, normal, spam.
Category:";

            var result = await _kernel.InvokePromptAsync<string>(prompt);
            var classification = result?.Trim().ToLowerInvariant() ?? "normal";

            if (classification != "important" && classification != "normal" && classification != "spam")
            {
                _logger.LogWarning("Unexpected classification output: '{Output}'. Defaulting to 'normal'.", classification);
                classification = "normal";
            }

            return classification;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to classify email ID: {Id}", email.Id);
            return "normal";
        }
    }

    public async Task<string> SummarizeEmailAsync(EmailMessage email)
    {
        try
        {
            _logger.LogInformation("Summarizing email from {From}, Subject: {Subject}", email.From, email.Subject);

            var prompt = $@"
Summarize the following email in exactly three sentences. The summary must capture:
1. Who sent the email and the main purpose.
2. The core content or context.
3. Any action items, dates, or immediate next steps mentioned.

Email to summarize:
From: {email.From}
Subject: {email.Subject}
Body:
{email.Body}

Your response must contain exactly three sentences. Do not add intro/outro text.
Summary:";

            var result = await _kernel.InvokePromptAsync<string>(prompt);
            return result?.Trim() ?? "Failed to generate summary.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to summarize email ID: {Id}", email.Id);
            return "Summary generation encountered an error.";
        }
    }

    public async Task<string> DraftReplyAsync(EmailMessage email)
    {
        try
        {
            _logger.LogInformation("Drafting reply for email from {From}, Subject: {Subject}", email.From, email.Subject);

            var prompt = $@"
You are a highly professional, polite, and helpful assistant drafting an email reply. Write a professional draft response to the sender on behalf of the recipient.

Original Email:
From: {email.From}
Subject: {email.Subject}
Body:
{email.Body}

Instructions:
- Keep the tone polite, professional, and friendly.
- Address the sender appropriately based on their name in 'From'.
- Acknowledge their message and offer a clear, helpful response.
- Use square brackets for any placeholders that need the user's custom details (e.g., [Date], [Meeting Time], [My Name]).
- Do not write headers (To/From/Subject) in the response. Return ONLY the body text of the drafted reply.

Draft Reply:";

            var result = await _kernel.InvokePromptAsync<string>(prompt);
            return result?.Trim() ?? "Dear sender,\n\nThank you for your email. I have received it and will get back to you as soon as possible.\n\nBest regards,\n[My Name]";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to draft reply for email ID: {Id}", email.Id);
            return "Draft generation encountered an error.";
        }
    }
}
