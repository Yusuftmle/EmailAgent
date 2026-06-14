using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmailAgent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "TrackedProducts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImageSelector",
                table: "SiteStrategyDefinitions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "TrackedProducts");

            migrationBuilder.DropColumn(
                name: "ImageSelector",
                table: "SiteStrategyDefinitions");
        }
    }
}
