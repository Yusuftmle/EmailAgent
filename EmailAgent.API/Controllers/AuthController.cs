using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.Threading;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Core.Entities;
using Google.Apis.Oauth2.v2;
using Google.Apis.Services;

namespace EmailAgent.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthController(EmailAgentDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public class GoogleAuthRequest
    {
        public string Code { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthRequest request)
    {
        var clientId = _configuration["Google:ClientId"];
        var clientSecret = _configuration["Google:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            return StatusCode(500, "Google Auth is not configured on the server. Missing ClientId or ClientSecret.");
        }

        try
        {
            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret
                }
            });

            // Exchange code for token
            var tokenResponse = await flow.ExchangeCodeForTokenAsync(
                userId: "user",
                code: request.Code,
                redirectUri: request.RedirectUri, // "postmessage"
                taskCancellationToken: CancellationToken.None);

            // Fetch user profile using the token
            var credential = new UserCredential(flow, "user", tokenResponse);
            var oauth2Service = new Oauth2Service(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "Aegis Email Agent",
            });
            var userInfo = await oauth2Service.Userinfo.Get().ExecuteAsync();

            var email = userInfo.Email;
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Google account has no email address.");
            }

            // Find or create the user in the database
            var user = await _dbContext.UserPreferences.FirstOrDefaultAsync(u => u.UserEmail == email);
            if (user == null)
            {
                user = new UserPreferences
                {
                    Id = Guid.NewGuid(),
                    UserEmail = email,
                    Name = userInfo.Name ?? "",
                    PairingCode = Guid.NewGuid().ToString(),
                    ShoppingTrackerIntervalHours = 12
                };
                _dbContext.UserPreferences.Add(user);
            }
            else
            {
                user.Name = userInfo.Name ?? user.Name; // update name just in case
            }

            // Always update tokens
            user.GoogleAccessToken = tokenResponse.AccessToken;
            if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
            {
                user.GoogleRefreshToken = tokenResponse.RefreshToken;
            }
            if (tokenResponse.ExpiresInSeconds.HasValue)
            {
                user.GoogleTokenExpiry = DateTimeOffset.UtcNow.AddSeconds(tokenResponse.ExpiresInSeconds.Value);
            }

            await _dbContext.SaveChangesAsync();

            // Generate Local JWT Token for our React App
            var tokenString = GenerateJwtToken(user);

            return Ok(new { 
                Token = tokenString, 
                User = new { 
                    user.Id, 
                    user.UserEmail, 
                    user.Name,
                    user.PairingCode,
                    user.WhatsAppTo,
                    user.TelegramBotToken,
                    user.TelegramChatId,
                    user.ShoppingTrackerIntervalHours
                } 
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Authentication failed: {ex.Message}");
        }
    }

    [HttpPost("dev-login")]
    public async Task<IActionResult> DevLogin()
    {
        var email = "admin@local.test";
        var user = await _dbContext.UserPreferences.FirstOrDefaultAsync(u => u.UserEmail == email);
        if (user == null)
        {
            user = new UserPreferences
            {
                Id = Guid.NewGuid(),
                UserEmail = email,
                Name = "Local Developer",
                PairingCode = Guid.NewGuid().ToString(),
                ShoppingTrackerIntervalHours = 12
            };
            _dbContext.UserPreferences.Add(user);
            await _dbContext.SaveChangesAsync();
        }

        var tokenString = GenerateJwtToken(user);
        return Ok(new { 
            Token = tokenString, 
            User = new { 
                user.Id, 
                user.UserEmail, 
                user.Name,
                user.PairingCode,
                user.WhatsAppTo,
                user.TelegramBotToken,
                user.TelegramChatId,
                user.ShoppingTrackerIntervalHours
            } 
        });
    }

    private string GenerateJwtToken(UserPreferences user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_for_hmacsha256";
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.UserEmail),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "AegisEmailAgent",
            audience: _configuration["Jwt:Audience"] ?? "AegisEmailAgent",
            claims: claims,
            expires: DateTime.Now.AddDays(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
