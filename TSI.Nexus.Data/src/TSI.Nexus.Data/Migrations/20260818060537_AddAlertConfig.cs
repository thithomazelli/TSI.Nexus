using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlertConfig",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Key = table.Column<string>(type: "varchar(255)", nullable: true),
                    Name = table.Column<string>(type: "longtext", nullable: true),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Enabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ThresholdDays = table.Column<int>(type: "int", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertConfig", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_AlertConfig_CreateDate",
                table: "AlertConfig",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_AlertConfig_Key",
                table: "AlertConfig",
                column: "Key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertConfig");
        }
    }
}
