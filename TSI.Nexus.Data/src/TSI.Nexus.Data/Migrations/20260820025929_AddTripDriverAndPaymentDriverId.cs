using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTripDriverAndPaymentDriverId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                table: "Payment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TripDriver",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TripId = table.Column<Guid>(type: "char(36)", nullable: false),
                    DriverId = table.Column<Guid>(type: "char(36)", nullable: false),
                    PaymentId = table.Column<Guid>(type: "char(36)", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripDriver", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripDriver_Driver_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Driver",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TripDriver_Payment_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payment",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TripDriver_Trip_TripId",
                        column: x => x.TripId,
                        principalTable: "Trip",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_DriverId",
                table: "Payment",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TripDriver_CreateDate",
                table: "TripDriver",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_TripDriver_DriverId",
                table: "TripDriver",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TripDriver_PaymentId",
                table: "TripDriver",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_TripDriver_TripId",
                table: "TripDriver",
                column: "TripId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_Driver_DriverId",
                table: "Payment",
                column: "DriverId",
                principalTable: "Driver",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payment_Driver_DriverId",
                table: "Payment");

            migrationBuilder.DropTable(
                name: "TripDriver");

            migrationBuilder.DropIndex(
                name: "IX_Payment_DriverId",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "Payment");
        }
    }
}
