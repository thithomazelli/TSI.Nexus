using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTripQuoteTripAndDocumentTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Order_Driver_DriverId",
                table: "Order");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Vehicle_VehicleId",
                table: "Order");

            migrationBuilder.DropForeignKey(
                name: "FK_Passenger_Order_OrderId",
                table: "Passenger");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceOrder_Order_OrderId",
                table: "ServiceOrder");

            migrationBuilder.DropForeignKey(
                name: "FK_TripLeg_Order_OrderId",
                table: "TripLeg");

            migrationBuilder.DropIndex(
                name: "IX_Order_DriverId",
                table: "Order");

            migrationBuilder.DropIndex(
                name: "IX_Order_VehicleId",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "TransportLicenseExpiryDate",
                table: "Vehicle");

            migrationBuilder.DropColumn(
                name: "TransportLicenseNumber",
                table: "Vehicle");

            migrationBuilder.DropColumn(
                name: "DailyCount",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "DistanceKm",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "Route",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "Order");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "TripLeg",
                newName: "TripId");

            migrationBuilder.RenameIndex(
                name: "IX_TripLeg_OrderId",
                table: "TripLeg",
                newName: "IX_TripLeg_TripId");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "ServiceOrder",
                newName: "TripId");

            migrationBuilder.RenameIndex(
                name: "IX_ServiceOrder_OrderId",
                table: "ServiceOrder",
                newName: "IX_ServiceOrder_TripId");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "Passenger",
                newName: "TripId");

            migrationBuilder.RenameIndex(
                name: "IX_Passenger_OrderId",
                table: "Passenger",
                newName: "IX_Passenger_TripId");

            migrationBuilder.AddColumn<Guid>(
                name: "TripId",
                table: "Transaction",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Quote",
                type: "longtext",
                nullable: false,
                defaultValue: "Product");

            migrationBuilder.AddColumn<Guid>(
                name: "TripId",
                table: "Payment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TripId",
                table: "Attachment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DocumentTemplate",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Type = table.Column<string>(type: "varchar(255)", nullable: false),
                    Name = table.Column<string>(type: "longtext", nullable: true),
                    FileName = table.Column<string>(type: "longtext", nullable: true),
                    Content = table.Column<string>(type: "longtext", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentTemplate", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FeatureToggle",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Key = table.Column<string>(type: "varchar(255)", nullable: true),
                    Name = table.Column<string>(type: "longtext", nullable: true),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Enabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureToggle", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuoteTrip",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Route = table.Column<string>(type: "longtext", nullable: true),
                    DistanceKm = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DailyCount = table.Column<int>(type: "int", nullable: false),
                    TransportLicenseNumber = table.Column<string>(type: "longtext", nullable: true),
                    TransportLicenseExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: true),
                    DriverId = table.Column<Guid>(type: "char(36)", nullable: true),
                    QuoteId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteTrip", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuoteTrip_Driver_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Driver",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuoteTrip_Quote_QuoteId",
                        column: x => x.QuoteId,
                        principalTable: "Quote",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuoteTrip_Vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Trip",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    TripNumber = table.Column<string>(type: "varchar(255)", nullable: true),
                    QuoteNumber = table.Column<string>(type: "longtext", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "(Price - (Price * Discount /100.0))", stored: true),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BusinessPartnerId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Route = table.Column<string>(type: "longtext", nullable: true),
                    DistanceKm = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DailyCount = table.Column<int>(type: "int", nullable: false),
                    TransportLicenseNumber = table.Column<string>(type: "longtext", nullable: true),
                    TransportLicenseExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: true),
                    DriverId = table.Column<Guid>(type: "char(36)", nullable: true),
                    TransactionId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trip", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trip_BusinessPartner_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartner",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Trip_Driver_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Driver",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Trip_Transaction_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Trip_Vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_TripId",
                table: "Payment",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_TripId",
                table: "Attachment",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTemplate_CreateDate",
                table: "DocumentTemplate",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTemplate_Type",
                table: "DocumentTemplate",
                column: "Type",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeatureToggle_CreateDate",
                table: "FeatureToggle",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureToggle_Key",
                table: "FeatureToggle",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteTrip_CreateDate",
                table: "QuoteTrip",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteTrip_DriverId",
                table: "QuoteTrip",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteTrip_QuoteId",
                table: "QuoteTrip",
                column: "QuoteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteTrip_VehicleId",
                table: "QuoteTrip",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Trip_BusinessPartnerId",
                table: "Trip",
                column: "BusinessPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Trip_CreateDate",
                table: "Trip",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Trip_DriverId",
                table: "Trip",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Trip_TransactionId",
                table: "Trip",
                column: "TransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trip_TripNumber",
                table: "Trip",
                column: "TripNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trip_VehicleId",
                table: "Trip",
                column: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_Trip_TripId",
                table: "Attachment",
                column: "TripId",
                principalTable: "Trip",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Passenger_Trip_TripId",
                table: "Passenger",
                column: "TripId",
                principalTable: "Trip",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_Trip_TripId",
                table: "Payment",
                column: "TripId",
                principalTable: "Trip",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceOrder_Trip_TripId",
                table: "ServiceOrder",
                column: "TripId",
                principalTable: "Trip",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TripLeg_Trip_TripId",
                table: "TripLeg",
                column: "TripId",
                principalTable: "Trip",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_Trip_TripId",
                table: "Attachment");

            migrationBuilder.DropForeignKey(
                name: "FK_Passenger_Trip_TripId",
                table: "Passenger");

            migrationBuilder.DropForeignKey(
                name: "FK_Payment_Trip_TripId",
                table: "Payment");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceOrder_Trip_TripId",
                table: "ServiceOrder");

            migrationBuilder.DropForeignKey(
                name: "FK_TripLeg_Trip_TripId",
                table: "TripLeg");

            migrationBuilder.DropTable(
                name: "DocumentTemplate");

            migrationBuilder.DropTable(
                name: "FeatureToggle");

            migrationBuilder.DropTable(
                name: "QuoteTrip");

            migrationBuilder.DropTable(
                name: "Trip");

            migrationBuilder.DropIndex(
                name: "IX_Payment_TripId",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Attachment_TripId",
                table: "Attachment");

            migrationBuilder.DropColumn(
                name: "TripId",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Quote");

            migrationBuilder.DropColumn(
                name: "TripId",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "TripId",
                table: "Attachment");

            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "TripLeg",
                newName: "OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_TripLeg_TripId",
                table: "TripLeg",
                newName: "IX_TripLeg_OrderId");

            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "ServiceOrder",
                newName: "OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_ServiceOrder_TripId",
                table: "ServiceOrder",
                newName: "IX_ServiceOrder_OrderId");

            migrationBuilder.RenameColumn(
                name: "TripId",
                table: "Passenger",
                newName: "OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_Passenger_TripId",
                table: "Passenger",
                newName: "IX_Passenger_OrderId");

            migrationBuilder.AddColumn<DateTime>(
                name: "TransportLicenseExpiryDate",
                table: "Vehicle",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportLicenseNumber",
                table: "Vehicle",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DailyCount",
                table: "Order",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DistanceKm",
                table: "Order",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                table: "Order",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Route",
                table: "Order",
                type: "longtext",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VehicleId",
                table: "Order",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Order_DriverId",
                table: "Order",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Order_VehicleId",
                table: "Order",
                column: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Driver_DriverId",
                table: "Order",
                column: "DriverId",
                principalTable: "Driver",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Vehicle_VehicleId",
                table: "Order",
                column: "VehicleId",
                principalTable: "Vehicle",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Passenger_Order_OrderId",
                table: "Passenger",
                column: "OrderId",
                principalTable: "Order",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceOrder_Order_OrderId",
                table: "ServiceOrder",
                column: "OrderId",
                principalTable: "Order",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TripLeg_Order_OrderId",
                table: "TripLeg",
                column: "OrderId",
                principalTable: "Order",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
