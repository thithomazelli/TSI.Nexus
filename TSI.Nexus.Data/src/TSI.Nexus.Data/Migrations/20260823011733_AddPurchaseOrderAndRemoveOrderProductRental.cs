using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseOrderAndRemoveOrderProductRental : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "OrderProduct");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "OrderProduct");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "OrderProduct");

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                table: "Transaction",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                table: "Payment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                table: "Attachment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PurchaseOrder",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    PurchaseOrderNumber = table.Column<string>(type: "varchar(255)", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "(Price - (Price * Discount /100.0))", stored: true),
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
                    table.PrimaryKey("PK_PurchaseOrder", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrder_BusinessPartner_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartner",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurchaseOrder_Transaction_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PurchaseOrderProduct",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))", stored: true),
                    PurchaseOrderId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ProductId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrderProduct", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderProduct_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderProduct_PurchaseOrder_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "PurchaseOrder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_PurchaseOrderId",
                table: "Payment",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_PurchaseOrderId",
                table: "Attachment",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrder_BusinessPartnerId",
                table: "PurchaseOrder",
                column: "BusinessPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrder_CreateDate",
                table: "PurchaseOrder",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrder_PurchaseOrderNumber",
                table: "PurchaseOrder",
                column: "PurchaseOrderNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrder_TransactionId",
                table: "PurchaseOrder",
                column: "TransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderProduct_CreateDate",
                table: "PurchaseOrderProduct",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderProduct_ProductId",
                table: "PurchaseOrderProduct",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderProduct_PurchaseOrderId",
                table: "PurchaseOrderProduct",
                column: "PurchaseOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_PurchaseOrder_PurchaseOrderId",
                table: "Attachment",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrder",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_PurchaseOrder_PurchaseOrderId",
                table: "Payment",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrder",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_PurchaseOrder_PurchaseOrderId",
                table: "Attachment");

            migrationBuilder.DropForeignKey(
                name: "FK_Payment_PurchaseOrder_PurchaseOrderId",
                table: "Payment");

            migrationBuilder.DropTable(
                name: "PurchaseOrderProduct");

            migrationBuilder.DropTable(
                name: "PurchaseOrder");

            migrationBuilder.DropIndex(
                name: "IX_Payment_PurchaseOrderId",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Attachment_PurchaseOrderId",
                table: "Attachment");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "Attachment");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "OrderProduct",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "OrderProduct",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "OrderProduct",
                type: "longtext",
                nullable: false);
        }
    }
}
