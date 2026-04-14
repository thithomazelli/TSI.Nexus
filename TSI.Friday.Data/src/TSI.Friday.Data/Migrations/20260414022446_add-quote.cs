using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class addquote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "QuoteId",
                table: "Payment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "QuoteId",
                table: "Attachment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Quote",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    OrderNumber = table.Column<string>(type: "varchar(255)", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "(Price - (Price * Discount / 100.0))", stored: true),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BusinessPartnerId = table.Column<Guid>(type: "char(36)", nullable: false),
                    TransactionId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quote", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quote_BusinessPartner_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartner",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Quote_Transaction_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuoteProduct",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount / 100.0))", stored: true),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    QuoteId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ProductId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteProduct", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuoteProduct_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuoteProduct_Quote_QuoteId",
                        column: x => x.QuoteId,
                        principalTable: "Quote",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_QuoteId",
                table: "Payment",
                column: "QuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_QuoteId",
                table: "Attachment",
                column: "QuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_Quote_BusinessPartnerId",
                table: "Quote",
                column: "BusinessPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Quote_CreateDate",
                table: "Quote",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Quote_OrderNumber",
                table: "Quote",
                column: "OrderNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quote_TransactionId",
                table: "Quote",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteProduct_CreateDate",
                table: "QuoteProduct",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteProduct_ProductId",
                table: "QuoteProduct",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteProduct_QuoteId",
                table: "QuoteProduct",
                column: "QuoteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_Quote_QuoteId",
                table: "Attachment",
                column: "QuoteId",
                principalTable: "Quote",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_Quote_QuoteId",
                table: "Payment",
                column: "QuoteId",
                principalTable: "Quote",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_Quote_QuoteId",
                table: "Attachment");

            migrationBuilder.DropForeignKey(
                name: "FK_Payment_Quote_QuoteId",
                table: "Payment");

            migrationBuilder.DropTable(
                name: "QuoteProduct");

            migrationBuilder.DropTable(
                name: "Quote");

            migrationBuilder.DropIndex(
                name: "IX_Payment_QuoteId",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Attachment_QuoteId",
                table: "Attachment");

            migrationBuilder.DropColumn(
                name: "QuoteId",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "QuoteId",
                table: "Attachment");
        }
    }
}
