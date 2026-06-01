using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmailAgent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenantAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatHistory", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailAnalysis",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    GmailId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    From = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Subject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    DraftReply = table.Column<string>(type: "text", nullable: false),
                    Importance = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailAnalysis", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserEmail = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    AiProvider = table.Column<string>(type: "text", nullable: false),
                    ApiKey = table.Column<string>(type: "text", nullable: false),
                    FocusCompanies = table.Column<string>(type: "jsonb", nullable: false),
                    Keywords = table.Column<string>(type: "jsonb", nullable: false),
                    PairingCode = table.Column<string>(type: "text", nullable: false),
                    GoogleAccessToken = table.Column<string>(type: "text", nullable: false),
                    GoogleRefreshToken = table.Column<string>(type: "text", nullable: false),
                    GoogleTokenExpiry = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TelegramChatId = table.Column<string>(type: "text", nullable: false),
                    WhatsAppSid = table.Column<string>(type: "text", nullable: false),
                    WhatsAppToken = table.Column<string>(type: "text", nullable: false),
                    WhatsAppFrom = table.Column<string>(type: "text", nullable: false),
                    WhatsAppTo = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPreferences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatHistory_SessionId",
                table: "ChatHistory",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatHistory_UserId",
                table: "ChatHistory",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailAnalysis_GmailId",
                table: "EmailAnalysis",
                column: "GmailId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailAnalysis_UserId",
                table: "EmailAnalysis",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPreferences_TelegramChatId",
                table: "UserPreferences",
                column: "TelegramChatId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPreferences_UserEmail",
                table: "UserPreferences",
                column: "UserEmail",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatHistory");

            migrationBuilder.DropTable(
                name: "EmailAnalysis");

            migrationBuilder.DropTable(
                name: "UserPreferences");
        }
    }
}
