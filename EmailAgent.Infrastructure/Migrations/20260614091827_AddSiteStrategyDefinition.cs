using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmailAgent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteStrategyDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteStrategyDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Domain = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FetchMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PriceSelector = table.Column<string>(type: "text", nullable: true),
                    TitleSelector = table.Column<string>(type: "text", nullable: true),
                    StockSelector = table.Column<string>(type: "text", nullable: true),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    LastVerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteStrategyDefinitions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SiteStrategyDefinitions_Domain",
                table: "SiteStrategyDefinitions",
                column: "Domain",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SiteStrategyDefinitions");
        }
    }
}
