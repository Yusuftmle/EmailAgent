using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Hangfire;
using Hangfire.PostgreSql;
using EmailAgent.Core.Repositories;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Infrastructure.Gmail;
using EmailAgent.Infrastructure.Jobs;
using EmailAgent.Infrastructure.Notifications;
using EmailAgent.Infrastructure.Repositories;
using EmailAgent.Agent;
using EmailAgent.Agent.Chat;
using EmailAgent.API.Plugins;
using EmailAgent.Agent.Connectors;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// 1. Database Configuration (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string 'Default' is missing from configuration.");
}
builder.Services.AddDbContext<EmailAgentDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Repository Dependency Injection
builder.Services.AddScoped<IEmailAnalysisRepository, EmailAnalysisRepository>();
builder.Services.AddScoped<IUserPreferencesRepository, UserPreferencesRepository>();
builder.Services.AddScoped<IChatHistoryRepository, ChatHistoryRepository>();

// 3. Infrastructure Service Dependency Injection
builder.Services.AddScoped<IGmailService, GmailService>();
builder.Services.AddScoped<ITelegramNotificationService, TelegramNotificationService>();
builder.Services.AddScoped<IWhatsAppNotificationService, WhatsAppNotificationService>();

// Centralized HttpClient Factory
builder.Services.AddHttpClient("AIAgentClient");

// Register plugins as Singletons/Transients
// (Removed AddTransient for plugins because they are created by the multi-tenant factory)

// Register Plugin Factory for Multi-Tenant users
builder.Services.AddTransient<Func<EmailAgent.Core.Entities.UserPreferences, IEnumerable<object>>>(sp => userPrefs =>
{
    return new List<object>
    {
        new EmailPlugin(sp.GetRequiredService<IGmailService>(), userPrefs),
        new NotificationPlugin(sp.GetRequiredService<IWhatsAppNotificationService>(), sp.GetRequiredService<ITelegramNotificationService>(), userPrefs)
    };
});

// Register Orchestrator
builder.Services.AddTransient<EmailAgent.Agent.Core.AegisAgentOrchestrator>();

// Register AI Agents & Chat services
builder.Services.AddScoped<IEmailAnalysisAgent, EmailAnalysisAgent>();
builder.Services.AddScoped<IChatService, ChatService>();

// 5. Hangfire Background Scheduler Configuration
builder.Services.AddHangfire(config =>
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UsePostgreSqlStorage(options =>
          {
              options.UseNpgsqlConnection(connectionString);
          }));

// builder.Services.AddHangfireServer(); // Temporarily Disabled for Testing

// Add job class to DI so Hangfire can instantiate it
builder.Services.AddScoped<DailyEmailJob>();

// 5.5 Register Telegram Bot Hosted Service
builder.Services.AddHostedService<EmailAgent.API.Services.TelegramBotHostedService>();

// Configure CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder =>
        {
            builder.WithOrigins("http://localhost:5173", "http://localhost:3000")
                   .AllowAnyHeader()
                   .AllowAnyMethod()
                   .AllowCredentials();
        });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AegisEmailAgent",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AegisEmailAgent",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_for_hmacsha256"))
        };
    });

// 6. Controller, CORS & OpenAPI/Swagger Setup
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 7. Auto-run Database Migrations at Startup (convenience for development)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<EmailAgentDbContext>();
        db.Database.EnsureCreated(); // creates database tables with new columns (UserEmail, AiProvider, ApiKey)
        db.Database.ExecuteSqlRaw(@"
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""WhatsAppSid"" text NOT NULL DEFAULT '';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""WhatsAppToken"" text NOT NULL DEFAULT '';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""WhatsAppFrom"" text NOT NULL DEFAULT '';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""WhatsAppTo"" text NOT NULL DEFAULT '';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""TelegramBotToken"" text NOT NULL DEFAULT '';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""TelegramChatId"" text NOT NULL DEFAULT '';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""PairingCode"" text NOT NULL DEFAULT '';
            TRUNCATE TABLE ""ChatHistory"";
            UPDATE ""UserPreferences"" SET ""AiProvider"" = 'Gemini', ""ApiKey"" = '', ""PairingCode"" = gen_random_uuid()::text WHERE ""PairingCode"" = '';
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization warning: {ex.Message}");
    }
}

// 8. HTTP Pipeline Configuration
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Add middleware
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", async context =>
{
    context.Response.Redirect("/swagger");
    await Task.CompletedTask;
});

// Hangfire Dashboard path (configured via appsettings.json or defaulting to /jobs)
var hangfirePath = builder.Configuration["Hangfire:DashboardPath"] ?? "/jobs";
app.UseHangfireDashboard(hangfirePath);

// 9. Register Recurring Background Cron Job (Temporarily Disabled for Testing)
// Runs daily at 08:00 (Cron: "0 8 * * *")
// using (var scope = app.Services.CreateScope())
// {
//     var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
//     recurringJobManager.AddOrUpdate<DailyEmailJob>(
//         "daily-email-analysis-job",
//         job => job.RunDailyAnalysisAsync(),
//         "*/2 * * * *", // Runs every 2 minutes
//         new RecurringJobOptions
//         {
//             TimeZone = TimeZoneInfo.Local
//         }
//     );
// }

app.Run();
