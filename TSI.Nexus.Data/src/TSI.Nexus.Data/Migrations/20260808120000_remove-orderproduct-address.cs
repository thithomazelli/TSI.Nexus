using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class removeorderproductaddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderProduct_Address_AddressId",
                table: "OrderProduct");

            migrationBuilder.DropIndex(
                name: "IX_OrderProduct_AddressId",
                table: "OrderProduct");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "OrderProduct");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AddressId",
                table: "OrderProduct",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderProduct_AddressId",
                table: "OrderProduct",
                column: "AddressId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderProduct_Address_AddressId",
                table: "OrderProduct",
                column: "AddressId",
                principalTable: "Address",
                principalColumn: "Id");
        }
    }
}
