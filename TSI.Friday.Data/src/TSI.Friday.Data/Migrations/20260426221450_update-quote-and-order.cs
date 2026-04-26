using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class updatequoteandorder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL for renaming to avoid provider issues with RenameColumn on some MySQL providers
            migrationBuilder.Sql("ALTER TABLE `Quote` RENAME COLUMN `OrderNumber` TO `QuoteNumber`;");
            migrationBuilder.Sql("ALTER TABLE `Quote` RENAME INDEX `IX_Quote_OrderNumber` TO `IX_Quote_QuoteNumber`;");

            migrationBuilder.AddColumn<string>(
                name: "QuoteNumber",
                table: "Order",
                type: "longtext",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "Quote",
                type: "decimal(18,2)",
                nullable: false,
                computedColumnSql: "(Price - (Price * Discount /100.0))",
                stored: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldComputedColumnSql: "(Price - (Price * Discount /100.0))",
                oldStored: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "OrderProduct",
                type: "decimal(18,2)",
                nullable: false,
                computedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))",
                stored: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldComputedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))",
                oldStored: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "Order",
                type: "decimal(18,2)",
                nullable: false,
                computedColumnSql: "(Price - (Price * Discount /100.0))",
                stored: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldComputedColumnSql: "(Price - (Price * Discount /100.0))",
                oldStored: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuoteNumber",
                table: "Order");

            // reverse rename using raw SQL
            migrationBuilder.Sql("ALTER TABLE `Quote` RENAME COLUMN `QuoteNumber` TO `OrderNumber`;");
            migrationBuilder.Sql("ALTER TABLE `Quote` RENAME INDEX `IX_Quote_QuoteNumber` TO `IX_Quote_OrderNumber`;");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "Quote",
                type: "decimal(18,2)",
                nullable: false,
                computedColumnSql: "(Price - (Price * Discount /100.0))",
                stored: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldComputedColumnSql: "(Price - (Price * Discount /100.0))",
                oldStored: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "OrderProduct",
                type: "decimal(18,2)",
                nullable: false,
                computedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))",
                stored: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldComputedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))",
                oldStored: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "Order",
                type: "decimal(18,2)",
                nullable: false,
                computedColumnSql: "(Price - (Price * Discount /100.0))",
                stored: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldComputedColumnSql: "(Price - (Price * Discount /100.0))",
                oldStored: true);
        }
    }
}
