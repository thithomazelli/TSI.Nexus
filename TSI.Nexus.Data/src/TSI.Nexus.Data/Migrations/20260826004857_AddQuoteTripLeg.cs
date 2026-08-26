using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteTripLeg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuoteTripLeg",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SequenceNumber = table.Column<int>(type: "int", nullable: false),
                    Origin = table.Column<string>(type: "longtext", nullable: true),
                    Destination = table.Column<string>(type: "longtext", nullable: true),
                    DepartureDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ArrivalDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DistanceKm = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "longtext", nullable: true),
                    QuoteTripId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteTripLeg", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuoteTripLeg_QuoteTrip_QuoteTripId",
                        column: x => x.QuoteTripId,
                        principalTable: "QuoteTrip",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteTripLeg_CreateDate",
                table: "QuoteTripLeg",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteTripLeg_QuoteTripId",
                table: "QuoteTripLeg",
                column: "QuoteTripId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuoteTripLeg");
        }
    }
}
