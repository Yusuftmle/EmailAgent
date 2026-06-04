using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmailAgent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssistantPersona",
                table: "UserPreferences",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "EnableDocumentAnalysisFeature",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableEmailFeature",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableFinanceFeature",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableRemindersFeature",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableShoppingFeature",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableWebSearchFeature",
                table: "UserPreferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ShoppingTrackerIntervalHours",
                table: "UserPreferences",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TelegramBotToken",
                table: "UserPreferences",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsInStock",
                table: "TrackedProducts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "NotificationLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PriceHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    IsInStock = table.Column<bool>(type: "boolean", nullable: false),
                    CheckedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Reminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    RemindAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsSent = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reminders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrackedCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryUrl = table.Column<string>(type: "text", nullable: false),
                    CategoryName = table.Column<string>(type: "text", nullable: false),
                    MinDiscountPercentage = table.Column<decimal>(type: "numeric", nullable: false),
                    RequiredFeatures = table.Column<string>(type: "text", nullable: true),
                    ComparisonGroupId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastCheckedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackedCategories", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationLogs");

            migrationBuilder.DropTable(
                name: "PriceHistories");

            migrationBuilder.DropTable(
                name: "Reminders");

            migrationBuilder.DropTable(
                name: "TrackedCategories");

            migrationBuilder.DropColumn(
                name: "AssistantPersona",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "EnableDocumentAnalysisFeature",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "EnableEmailFeature",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "EnableFinanceFeature",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "EnableRemindersFeature",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "EnableShoppingFeature",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "EnableWebSearchFeature",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "ShoppingTrackerIntervalHours",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "TelegramBotToken",
                table: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "IsInStock",
                table: "TrackedProducts");
        }
    }
}
