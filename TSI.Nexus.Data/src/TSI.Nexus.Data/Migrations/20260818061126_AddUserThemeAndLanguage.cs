using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserThemeAndLanguage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "AspNetUsers",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "AspNetUsers",
                type: "longtext",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Language",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "AspNetUsers");
        }
    }
}
