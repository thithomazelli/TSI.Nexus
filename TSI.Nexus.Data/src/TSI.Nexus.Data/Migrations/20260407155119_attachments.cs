using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class attachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Attachment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    FileName = table.Column<string>(type: "longtext", nullable: true),
                    Path = table.Column<string>(type: "longtext", nullable: true),
                    BusinessPartnerId = table.Column<Guid>(type: "char(36)", nullable: true),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: true),
                    TransactionId = table.Column<Guid>(type: "char(36)", nullable: true),
                    PaymentId = table.Column<Guid>(type: "char(36)", nullable: true),
                    ProductId = table.Column<Guid>(type: "char(36)", nullable: true),
                    UserId = table.Column<string>(type: "varchar(255)", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attachment_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attachment_BusinessPartner_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartner",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attachment_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attachment_Payment_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attachment_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Attachment_Transaction_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_BusinessPartnerId",
                table: "Attachment",
                column: "BusinessPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_CreateDate",
                table: "Attachment",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_OrderId",
                table: "Attachment",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_PaymentId",
                table: "Attachment",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_ProductId",
                table: "Attachment",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_TransactionId",
                table: "Attachment",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_UserId",
                table: "Attachment",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachment");
        }
    }
}
