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

// 0. Data Protection for encrypting sensitive fields like ApiKey
builder.Services.AddDataProtection();

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
builder.Services.AddScoped<EmailAgent.Infrastructure.Services.ProductScraperService>();
builder.Services.AddScoped<EmailAgent.Infrastructure.Services.CategoryScraperService>();
builder.Services.AddScoped<EmailAgent.Agent.UniversalScraperAgent>();
builder.Services.AddScoped<EmailAgent.Agent.DealEvaluatorAgent>();
builder.Services.AddScoped<EmailAgent.Infrastructure.Services.ISpeechToTextService, EmailAgent.Infrastructure.Services.GroqSpeechToTextService>();

// Centralized HttpClient Factory
builder.Services.AddHttpClient("AIAgentClient");

// Register plugins as Singletons/Transients
// (Removed AddTransient for plugins because they are created by the multi-tenant factory)

// Register Plugin Factory for Multi-Tenant users
builder.Services.AddTransient<Func<EmailAgent.Core.Entities.UserPreferences, IEnumerable<object>>>(sp => userPrefs =>
{
    var plugins = new List<object>();

    // Always loaded
    plugins.Add(new NotificationPlugin(sp.GetRequiredService<IWhatsAppNotificationService>(), sp.GetRequiredService<ITelegramNotificationService>(), userPrefs));
    plugins.Add(new CurrencyPlugin()); // Currency plugin is core

    if (userPrefs.EnableEmailFeature)
    {
        plugins.Add(new EmailPlugin(sp.GetRequiredService<IGmailService>(), userPrefs));
        plugins.Add(new EmailAgent.API.Plugins.BulkAnalysisPlugin(sp.GetRequiredService<EmailAgentDbContext>(), userPrefs.Id));
    }

    if (userPrefs.EnableShoppingFeature)
    {
        plugins.Add(new ShoppingPlugin(sp.GetRequiredService<EmailAgentDbContext>(), sp.GetRequiredService<EmailAgent.Infrastructure.Services.ProductScraperService>(), userPrefs.Id));
        plugins.Add(new EmailAgent.API.Plugins.CategoryTrackingPlugin(sp.GetRequiredService<EmailAgentDbContext>(), userPrefs.Id));
    }

    if (userPrefs.EnableWebSearchFeature)
    {
        plugins.Add(new EmailAgent.API.Plugins.WebSearchPlugin(sp.GetRequiredService<IHttpClientFactory>().CreateClient("AIAgentClient")));
        plugins.Add(new EmailAgent.API.Plugins.DeepWebScraperPlugin(sp.GetRequiredService<IHttpClientFactory>().CreateClient("AIAgentClient")));
    }

    if (userPrefs.EnableFinanceFeature)
    {
        plugins.Add(new EmailAgent.API.Plugins.FinancePlugin(sp.GetRequiredService<IHttpClientFactory>().CreateClient("AIAgentClient")));
    }

    if (userPrefs.EnableDocumentAnalysisFeature)
    {
        plugins.Add(new EmailAgent.API.Plugins.DocumentPlugin());
    }

    if (userPrefs.EnableRemindersFeature)
    {
        plugins.Add(new EmailAgent.API.Plugins.ReminderPlugin(sp.GetRequiredService<EmailAgentDbContext>(), userPrefs.Id));
    }

    return plugins;
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
builder.Services.AddScoped<ShoppingTrackerJob>();
builder.Services.AddScoped<DailyBriefingJob>();
builder.Services.AddScoped<MorningBriefingJob>();

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
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""ShoppingTrackerIntervalHours"" integer NOT NULL DEFAULT 12;
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""AssistantPersona"" text NOT NULL DEFAULT 'Sen enerjik, samimi ve motive edici bir yapay zeka asistanısın. Kullanıcıya her zaman yardımcı ol.';
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""EnableEmailFeature"" boolean NOT NULL DEFAULT true;
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""EnableShoppingFeature"" boolean NOT NULL DEFAULT true;
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""EnableFinanceFeature"" boolean NOT NULL DEFAULT true;
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""EnableWebSearchFeature"" boolean NOT NULL DEFAULT true;
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""EnableDocumentAnalysisFeature"" boolean NOT NULL DEFAULT true;
            ALTER TABLE ""UserPreferences"" ADD COLUMN IF NOT EXISTS ""EnableRemindersFeature"" boolean NOT NULL DEFAULT true;

            CREATE TABLE IF NOT EXISTS ""TrackedCategories"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""CategoryUrl"" text NOT NULL,
                ""CategoryName"" text NOT NULL,
                ""MinDiscountPercentage"" numeric NOT NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL,
                ""LastCheckedAt"" timestamp with time zone NULL,
                CONSTRAINT ""PK_TrackedCategories"" PRIMARY KEY (""Id"")
            );

            ALTER TABLE ""TrackedCategories"" ADD COLUMN IF NOT EXISTS ""RequiredFeatures"" text NULL;
            ALTER TABLE ""TrackedCategories"" ADD COLUMN IF NOT EXISTS ""ComparisonGroupId"" uuid NULL;
            ALTER TABLE ""TrackedProducts"" ADD COLUMN IF NOT EXISTS ""IsInStock"" boolean NOT NULL DEFAULT true;

            CREATE TABLE IF NOT EXISTS ""PriceHistory"" (
                ""Id"" uuid NOT NULL,
                ""ProductId"" uuid NOT NULL,
                ""Price"" numeric NOT NULL,
                ""IsInStock"" boolean NOT NULL DEFAULT true,
                ""CheckedAt"" timestamp NOT NULL DEFAULT NOW(),
                CONSTRAINT ""PK_PriceHistory"" PRIMARY KEY (""Id"")
            );

            CREATE TABLE IF NOT EXISTS ""Reminders"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""Message"" text NOT NULL,
                ""RemindAt"" timestamp NOT NULL,
                ""IsSent"" boolean NOT NULL DEFAULT false,
                ""CreatedAt"" timestamp NOT NULL DEFAULT NOW(),
                CONSTRAINT ""PK_Reminders"" PRIMARY KEY (""Id"")
            );

            CREATE TABLE IF NOT EXISTS ""NotificationLogs"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""Message"" text NOT NULL,
                ""Type"" text NOT NULL DEFAULT 'PriceDrop',
                ""SentAt"" timestamp NOT NULL DEFAULT NOW(),
                CONSTRAINT ""PK_NotificationLogs"" PRIMARY KEY (""Id"")
            );

            UPDATE ""UserPreferences"" SET ""PairingCode"" = gen_random_uuid()::text WHERE ""PairingCode"" = '';
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

// Shopping Tracker Job - Runs every 12 hours
using (var scope = app.Services.CreateScope())
{
    try 
    {
        var recurringJobManager = scope.ServiceProvider.GetService<IRecurringJobManager>();
        if (recurringJobManager != null)
        {
            recurringJobManager.AddOrUpdate<ShoppingTrackerJob>(
                "shopping-tracker-job",
                job => job.CheckPricesAsync(),
                "0 * * * *", // Every hour
                new RecurringJobOptions
                {
                    TimeZone = TimeZoneInfo.Local
                }
            );

            recurringJobManager.AddOrUpdate<DailyBriefingJob>(
                "daily-briefing-job",
                job => job.SendMorningBriefingAsync(),
                "0 8 * * *", // Every day at 08:00 AM
                new RecurringJobOptions
                {
                    TimeZone = TimeZoneInfo.Local
                }
            );

            // Our new MorningBriefingJob that also processes reminders every 5 minutes
            recurringJobManager.AddOrUpdate<MorningBriefingJob>(
                "morning-briefing-and-reminders",
                job => job.RunAsync(),
                "*/5 * * * *", // Every 5 minutes
                new RecurringJobOptions
                {
                    TimeZone = TimeZoneInfo.Utc
                }
            );
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Hangfire registration warning: {ex.Message}");
    }
}

app.Run();
