using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceProductFuelLogProductAndVehicleDriverAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_Driver_DriverId",
                table: "Attachment");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_Vehicle_VehicleId",
                table: "Attachment");

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "FuelLog",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductName",
                table: "FuelLog",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductSku",
                table: "FuelLog",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "FuelLog",
                type: "longtext",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VehicleMaintenanceProduct",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))", stored: true),
                    VehicleMaintenanceId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ProductId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleMaintenanceProduct", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehicleMaintenanceProduct_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VehicleMaintenanceProduct_VehicleMaintenance_VehicleMaintena~",
                        column: x => x.VehicleMaintenanceId,
                        principalTable: "VehicleMaintenance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_FuelLog_ProductId",
                table: "FuelLog",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenanceProduct_CreateDate",
                table: "VehicleMaintenanceProduct",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenanceProduct_ProductId",
                table: "VehicleMaintenanceProduct",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenanceProduct_VehicleMaintenanceId",
                table: "VehicleMaintenanceProduct",
                column: "VehicleMaintenanceId");

            // Preserve the single Product/PartQuantity already set on existing VehicleMaintenance
            // rows as a VehicleMaintenanceProduct line before the old columns are dropped below.
            migrationBuilder.Sql(
                @"INSERT INTO VehicleMaintenanceProduct
                    (Id, Description, Quantity, Price, Discount, VehicleMaintenanceId, ProductId, CreateDate, ModifyDate)
                  SELECT
                    UUID(), p.Name, GREATEST(vm.PartQuantity, 1), p.Price, 0, vm.Id, vm.ProductId, vm.CreateDate, vm.ModifyDate
                  FROM VehicleMaintenance vm
                  JOIN Product p ON p.Id = vm.ProductId
                  WHERE vm.ProductId IS NOT NULL;"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleMaintenance_Product_ProductId",
                table: "VehicleMaintenance");

            migrationBuilder.DropIndex(
                name: "IX_VehicleMaintenance_ProductId",
                table: "VehicleMaintenance");

            migrationBuilder.DropColumn(
                name: "PartQuantity",
                table: "VehicleMaintenance");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "VehicleMaintenance");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_Driver_DriverId",
                table: "Attachment",
                column: "DriverId",
                principalTable: "Driver",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_Vehicle_VehicleId",
                table: "Attachment",
                column: "VehicleId",
                principalTable: "Vehicle",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FuelLog_Product_ProductId",
                table: "FuelLog",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_Driver_DriverId",
                table: "Attachment");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_Vehicle_VehicleId",
                table: "Attachment");

            migrationBuilder.DropForeignKey(
                name: "FK_FuelLog_Product_ProductId",
                table: "FuelLog");

            migrationBuilder.DropTable(
                name: "VehicleMaintenanceProduct");

            migrationBuilder.DropIndex(
                name: "IX_FuelLog_ProductId",
                table: "FuelLog");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "FuelLog");

            migrationBuilder.DropColumn(
                name: "ProductName",
                table: "FuelLog");

            migrationBuilder.DropColumn(
                name: "ProductSku",
                table: "FuelLog");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "FuelLog");

            migrationBuilder.AddColumn<int>(
                name: "PartQuantity",
                table: "VehicleMaintenance",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "VehicleMaintenance",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenance_ProductId",
                table: "VehicleMaintenance",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_Driver_DriverId",
                table: "Attachment",
                column: "DriverId",
                principalTable: "Driver",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_Vehicle_VehicleId",
                table: "Attachment",
                column: "VehicleId",
                principalTable: "Vehicle",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleMaintenance_Product_ProductId",
                table: "VehicleMaintenance",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
