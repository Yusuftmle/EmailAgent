using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmailAgent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSeenListings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SeenListings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingIdentifier = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    LastSeenPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    FirstSeenAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeenListings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SeenListings_CategoryId",
                table: "SeenListings",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SeenListings_UserId",
                table: "SeenListings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeenListings_UserId_CategoryId_ListingIdentifier",
                table: "SeenListings",
                columns: new[] { "UserId", "CategoryId", "ListingIdentifier" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SeenListings");
        }
    }
}
