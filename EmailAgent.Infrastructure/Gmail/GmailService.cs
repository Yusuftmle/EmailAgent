using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Gmail.v1;
using Google.Apis.Gmail.v1.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using EmailAgent.Core.Entities;

using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;

namespace EmailAgent.Infrastructure.Gmail;

public interface IGmailService
{
    Task<IEnumerable<EmailMessage>> FetchUnreadEmailsLast24HoursAsync(UserPreferences user, CancellationToken cancellationToken = default);
    Task SendEmailAsync(string to, string subject, string body, UserPreferences user, CancellationToken cancellationToken = default);
}

public class GmailService : IGmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<GmailService> _logger;
    private const string ApplicationName = "EmailAgent";
    private static readonly string[] Scopes = { 
        Google.Apis.Gmail.v1.GmailService.Scope.GmailReadonly,
        Google.Apis.Gmail.v1.GmailService.Scope.GmailSend 
    };

    public GmailService(IConfiguration config, ILogger<GmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private Google.Apis.Gmail.v1.GmailService GetGmailService(UserPreferences user)
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

            return new Google.Apis.Gmail.v1.GmailService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = ApplicationName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Gmail API service with User Token.");
            throw;
        }
    }

    public async Task<IEnumerable<EmailMessage>> FetchUnreadEmailsLast24HoursAsync(UserPreferences user, CancellationToken cancellationToken = default)
    {
        var emails = new List<EmailMessage>();
        try
        {
            var service = GetGmailService(user);

            _logger.LogInformation("Fetching unread emails from the last 1 hour...");
            var listRequest = service.Users.Messages.List("me");
            var epochOneHourAgo = DateTimeOffset.UtcNow.AddHours(-1).ToUnixTimeSeconds();
            listRequest.Q = $"is:unread after:{epochOneHourAgo}"; // last 1h unread
            
            var listResponse = await listRequest.ExecuteAsync(cancellationToken);
            if (listResponse.Messages == null || !listResponse.Messages.Any())
            {
                _logger.LogInformation("No unread emails found in the last 24 hours.");
                return emails;
            }

            foreach (var msgSummary in listResponse.Messages)
            {
                try
                {
                    var msgRequest = service.Users.Messages.Get("me", msgSummary.Id);
                    msgRequest.Format = UsersResource.MessagesResource.GetRequest.FormatEnum.Full;
                    
                    var message = await msgRequest.ExecuteAsync(cancellationToken);
                    if (message == null) continue;

                    var email = ParseGmailMessage(message);
                    emails.Add(email);
                    _logger.LogInformation("Successfully fetched and parsed email ID: {Id}, Subject: {Subject}", email.Id, email.Subject);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching full content for Gmail message ID: {MsgId}", msgSummary.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch emails from Gmail API.");
        }

        return emails;
    }

    public async Task SendEmailAsync(string to, string subject, string body, UserPreferences user, CancellationToken cancellationToken = default)
    {
        try
        {
            var service = GetGmailService(user);
            _logger.LogInformation("Sending email to: {To}, Subject: {Subject}", to, subject);

            var subjectEncoded = $"=?utf-8?B?{Convert.ToBase64String(Encoding.UTF8.GetBytes(subject))}?=";
            var emailText = $"To: {to}\r\n" +
                            $"Subject: {subjectEncoded}\r\n" +
                            "Content-Type: text/plain; charset=utf-8\r\n\r\n" +
                            $"{body}";
            var plainTextBytes = Encoding.UTF8.GetBytes(emailText);
            var rawMessage = Convert.ToBase64String(plainTextBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");

            var message = new Message { Raw = rawMessage };
            var request = service.Users.Messages.Send(message, "me");
            
            await request.ExecuteAsync(cancellationToken);
            _logger.LogInformation("Successfully sent email to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via Gmail API to {To}", to);
            throw;
        }
    }

    private EmailMessage ParseGmailMessage(Message message)
    {
        var email = new EmailMessage
        {
            Id = message.Id,
            Date = DateTime.UtcNow
        };

        if (message.Payload?.Headers != null)
        {
            var fromHeader = message.Payload.Headers.FirstOrDefault(h => string.Equals(h.Name, "From", StringComparison.OrdinalIgnoreCase));
            email.From = fromHeader?.Value ?? "Unknown Sender";

            var subjectHeader = message.Payload.Headers.FirstOrDefault(h => string.Equals(h.Name, "Subject", StringComparison.OrdinalIgnoreCase));
            email.Subject = subjectHeader?.Value ?? "(No Subject)";

            var dateHeader = message.Payload.Headers.FirstOrDefault(h => string.Equals(h.Name, "Date", StringComparison.OrdinalIgnoreCase));
            if (dateHeader != null && DateTime.TryParse(dateHeader.Value, out var dateParsed))
            {
                email.Date = dateParsed.ToUniversalTime();
            }
        }

        // Extract body
        email.Body = ExtractBody(message.Payload!) ?? message.Snippet ?? string.Empty;

        return email;
    }

    private string? ExtractBody(MessagePart part)
    {
        if (part == null) return null;

        // If body is directly available in the part and has data, decode it
        if (!string.IsNullOrEmpty(part.Body?.Data))
        {
            return DecodeBase64Url(part.Body.Data);
        }

        // If it's multipart, recursively look into parts
        if (part.Parts != null && part.Parts.Any())
        {
            // Prefer text/plain if available
            var plainTextPart = part.Parts.FirstOrDefault(p => p.MimeType == "text/plain");
            if (plainTextPart != null)
            {
                var body = ExtractBody(plainTextPart);
                if (!string.IsNullOrEmpty(body)) return body;
            }

            // Fallback to text/html
            var htmlPart = part.Parts.FirstOrDefault(p => p.MimeType == "text/html");
            if (htmlPart != null)
            {
                var body = ExtractBody(htmlPart);
                if (!string.IsNullOrEmpty(body)) return body;
            }

            // Otherwise scan all subparts recursively
            foreach (var subPart in part.Parts)
            {
                var body = ExtractBody(subPart);
                if (!string.IsNullOrEmpty(body)) return body;
            }
        }

        return null;
    }

    private string DecodeBase64Url(string base64Url)
    {
        var input = base64Url.Replace('-', '+').Replace('_', '/');
        switch (input.Length % 4)
        {
            case 2: input += "=="; break;
            case 3: input += "="; break;
        }
        var bytes = Convert.FromBase64String(input);
        return Encoding.UTF8.GetString(bytes);
    }
}
