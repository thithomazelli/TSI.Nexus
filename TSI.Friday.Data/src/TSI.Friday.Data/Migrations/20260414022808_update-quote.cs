using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class updatequote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payment_Quote_QuoteId",
                table: "Payment");

            migrationBuilder.DropForeignKey(
                name: "FK_Quote_Transaction_TransactionId",
                table: "Quote");

            migrationBuilder.DropIndex(
                name: "IX_Quote_TransactionId",
                table: "Quote");

            migrationBuilder.DropIndex(
                name: "IX_Payment_QuoteId",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "QuoteId",
                table: "Payment");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TransactionId",
                table: "Quote",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "QuoteId",
                table: "Payment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quote_TransactionId",
                table: "Quote",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_QuoteId",
                table: "Payment",
                column: "QuoteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_Quote_QuoteId",
                table: "Payment",
                column: "QuoteId",
                principalTable: "Quote",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Quote_Transaction_TransactionId",
                table: "Quote",
                column: "TransactionId",
                principalTable: "Transaction",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
