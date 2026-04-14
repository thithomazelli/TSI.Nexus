using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class quotepaymentfields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Condition",
                table: "Quote",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpenseTotalPrice",
                table: "Quote",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Method",
                table: "Quote",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PaymentTotalPrice",
                table: "Quote",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TotalOfExpenses",
                table: "Quote",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalOfPayments",
                table: "Quote",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Condition",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "ExpenseTotalPrice",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "Method",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "PaymentTotalPrice",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "TotalOfExpenses",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "TotalOfPayments",
                table: "Quote");
        }
    }
}
