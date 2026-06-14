using System.Collections.Generic;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using EmailAgent.Core.Entities;

namespace EmailAgent.Infrastructure.Data;

public class EmailAgentDbContext : DbContext
{
    public EmailAgentDbContext(DbContextOptions<EmailAgentDbContext> options) : base(options)
    {
    }

    public DbSet<EmailAnalysis> EmailAnalyses => Set<EmailAnalysis>();
    public DbSet<UserPreferences> UserPreferences => Set<UserPreferences>();
    public DbSet<ChatHistory> ChatHistories => Set<ChatHistory>();
    public DbSet<TrackedProduct> TrackedProducts => Set<TrackedProduct>();
    public DbSet<TrackedCategory> TrackedCategories => Set<TrackedCategory>();
    public DbSet<PriceHistory> PriceHistories => Set<PriceHistory>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<NotifiedCategoryDeal> NotifiedCategoryDeals => Set<NotifiedCategoryDeal>();
    public DbSet<SeenListing> SeenListings => Set<SeenListing>();
    public DbSet<SiteStrategyDefinition> SiteStrategyDefinitions => Set<SiteStrategyDefinition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure EmailAnalysis table
        modelBuilder.Entity<EmailAnalysis>(entity =>
        {
            entity.ToTable("EmailAnalysis");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId); // Multi-tenant index
            entity.Property(e => e.GmailId).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.GmailId).IsUnique();
            entity.Property(e => e.From).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Importance).IsRequired().HasMaxLength(50);
        });

        // Configure UserPreferences table with JSON serialization ValueConverters for lists
        var stringListConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
        );

        modelBuilder.Entity<UserPreferences>(entity =>
        {
            entity.ToTable("UserPreferences");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserEmail).IsUnique(); // Ensure emails are unique
            entity.HasIndex(e => e.TelegramChatId); // For quick bot lookups
            entity.Property(e => e.FocusCompanies)
                .HasConversion(stringListConverter)
                .HasColumnType("jsonb");
            entity.Property(e => e.Keywords)
                .HasConversion(stringListConverter)
                .HasColumnType("jsonb");
        });

        // Configure ChatHistory table
        modelBuilder.Entity<ChatHistory>(entity =>
        {
            entity.ToTable("ChatHistory");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId); // Multi-tenant index
            entity.Property(e => e.SessionId).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.SessionId);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Content).IsRequired();
        });

        // Configure SeenListings table
        modelBuilder.Entity<SeenListing>(entity =>
        {
            entity.ToTable("SeenListings");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CategoryId);
            entity.Property(e => e.ListingIdentifier).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => new { e.UserId, e.CategoryId, e.ListingIdentifier }).IsUnique();
        });

        // Configure SiteStrategyDefinition table
        modelBuilder.Entity<SiteStrategyDefinition>(entity =>
        {
            entity.ToTable("SiteStrategyDefinitions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Domain).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Domain).IsUnique();
            entity.Property(e => e.FetchMethod).IsRequired().HasMaxLength(50);
        });
    }
}
