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
using EmailAgent.Agent.Connectors;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// 1. Database Configuration (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("Default") 
    ?? "Host=localhost;Database=emailagent;Username=postgres;Password=postgres";
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

// 4. Semantic Kernel & Claude AI Orchestration
var claudeApiKey = builder.Configuration["Claude:ApiKey"] ?? string.Empty;
var claudeModel = builder.Configuration["Claude:Model"] ?? "claude-sonnet-4-5";

builder.Services.AddClaudeChatCompletion(claudeModel, claudeApiKey);

// Register standard Kernel service in DI
builder.Services.AddTransient<Kernel>(sp =>
{
    var chatCompletion = sp.GetRequiredService<IChatCompletionService>();
    var kernelBuilder = Kernel.CreateBuilder();
    // Register our Claude completion in the kernel builder
    kernelBuilder.Services.AddKeyedSingleton<IChatCompletionService>(null, chatCompletion);
    return kernelBuilder.Build();
});

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

builder.Services.AddHangfireServer();

// Add job class to DI so Hangfire can instantiate it
builder.Services.AddScoped<DailyEmailJob>();

// 6. Controller, CORS & OpenAPI/Swagger Setup
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // standard React/Vite ports
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

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

// Use CORS
app.UseCors("ReactAppPolicy");

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

// 9. Register Recurring Background Cron Job
// Runs daily at 08:00 (Cron: "0 8 * * *")
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    recurringJobManager.AddOrUpdate<DailyEmailJob>(
        "daily-email-analysis-job",
        job => job.RunDailyAnalysisAsync(),
        "*/2 * * * *", // Runs every 2 minutes
        new RecurringJobOptions
        {
            TimeZone = TimeZoneInfo.Local
        }
    );
}

app.Run();
