using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "VehicleMaintenance",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Vehicle",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payment",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Driver",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext");

            migrationBuilder.AlterColumn<string>(
                name: "SocialSecurityCard",
                table: "BusinessPartner",
                type: "varchar(255)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "BusinessPartner",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenance_Status",
                table: "VehicleMaintenance",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicle_Status",
                table: "Vehicle",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_Date",
                table: "Payment",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_Status",
                table: "Payment",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Order_Date",
                table: "Order",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Driver_Status",
                table: "Driver",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessPartner_Email",
                table: "BusinessPartner",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessPartner_SocialSecurityCard",
                table: "BusinessPartner",
                column: "SocialSecurityCard");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehicleMaintenance_Status",
                table: "VehicleMaintenance");

            migrationBuilder.DropIndex(
                name: "IX_Vehicle_Status",
                table: "Vehicle");

            migrationBuilder.DropIndex(
                name: "IX_Payment_Date",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Payment_Status",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Order_Date",
                table: "Order");

            migrationBuilder.DropIndex(
                name: "IX_Driver_Status",
                table: "Driver");

            migrationBuilder.DropIndex(
                name: "IX_BusinessPartner_Email",
                table: "BusinessPartner");

            migrationBuilder.DropIndex(
                name: "IX_BusinessPartner_SocialSecurityCard",
                table: "BusinessPartner");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "VehicleMaintenance",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Vehicle",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payment",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Driver",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)");

            migrationBuilder.AlterColumn<string>(
                name: "SocialSecurityCard",
                table: "BusinessPartner",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "BusinessPartner",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)");
        }
    }
}
