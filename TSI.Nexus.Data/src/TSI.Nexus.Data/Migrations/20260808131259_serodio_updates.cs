using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Nexus.Data.Migrations
{
    /// <inheritdoc />
    public partial class serodio_updates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                table: "Attachment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VehicleId",
                table: "Attachment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Driver",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Name = table.Column<string>(type: "longtext", nullable: true),
                    Email = table.Column<string>(type: "longtext", nullable: true),
                    Phone = table.Column<string>(type: "longtext", nullable: true),
                    Mobile = table.Column<string>(type: "longtext", nullable: true),
                    Photo = table.Column<string>(type: "longtext", nullable: true),
                    SocialSecurityCard = table.Column<string>(type: "varchar(255)", nullable: true),
                    NationalIdCard = table.Column<string>(type: "longtext", nullable: true),
                    Birthday = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    LicenseNumber = table.Column<string>(type: "longtext", nullable: true),
                    LicenseCategory = table.Column<string>(type: "longtext", nullable: true),
                    LicenseExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EmploymentType = table.Column<string>(type: "longtext", nullable: false),
                    AdmissionDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    CommissionPercentage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Driver", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Passenger",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Name = table.Column<string>(type: "longtext", nullable: true),
                    DocumentNumber = table.Column<string>(type: "longtext", nullable: true),
                    Seat = table.Column<string>(type: "longtext", nullable: true),
                    Phone = table.Column<string>(type: "longtext", nullable: true),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passenger", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Passenger_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TripLeg",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    SequenceNumber = table.Column<int>(type: "int", nullable: false),
                    Origin = table.Column<string>(type: "longtext", nullable: true),
                    Destination = table.Column<string>(type: "longtext", nullable: true),
                    DepartureDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ArrivalDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DistanceKm = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "longtext", nullable: true),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripLeg", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripLeg_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Vehicle",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Plate = table.Column<string>(type: "varchar(255)", nullable: true),
                    Renavam = table.Column<string>(type: "longtext", nullable: true),
                    Chassis = table.Column<string>(type: "longtext", nullable: true),
                    Brand = table.Column<string>(type: "longtext", nullable: true),
                    Model = table.Column<string>(type: "longtext", nullable: true),
                    ManufactureYear = table.Column<int>(type: "int", nullable: false),
                    ModelYear = table.Column<int>(type: "int", nullable: false),
                    SeatCapacity = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "longtext", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    PricePerKm = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DailyRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TransportLicenseNumber = table.Column<string>(type: "longtext", nullable: true),
                    TransportLicenseExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Odometer = table.Column<int>(type: "int", nullable: false),
                    Photo = table.Column<string>(type: "longtext", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicle", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FuelLog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Odometer = table.Column<int>(type: "int", nullable: false),
                    Liters = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PricePerLiter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GasStation = table.Column<string>(type: "longtext", nullable: true),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FuelLog_Vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ServiceOrder",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Number = table.Column<string>(type: "varchar(255)", nullable: true),
                    IssueDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: false),
                    DriverId = table.Column<Guid>(type: "char(36)", nullable: false),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceOrder", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceOrder_Driver_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Driver",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceOrder_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ServiceOrder_Vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "VehicleMaintenance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Type = table.Column<string>(type: "longtext", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    ScheduledDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CompletedDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    OdometerAtService = table.Column<int>(type: "int", nullable: true),
                    Cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ProductId = table.Column<Guid>(type: "char(36)", nullable: true),
                    PartQuantity = table.Column<int>(type: "int", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleMaintenance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehicleMaintenance_Product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VehicleMaintenance_Vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Commission",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Percentage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BaseAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false),
                    PaidDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ServiceOrderId = table.Column<Guid>(type: "char(36)", nullable: false),
                    DriverId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Commission", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Commission_Driver_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Driver",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Commission_ServiceOrder_ServiceOrderId",
                        column: x => x.ServiceOrderId,
                        principalTable: "ServiceOrder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Order_DriverId",
                table: "Order",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Order_VehicleId",
                table: "Order",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_DriverId",
                table: "Attachment",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_VehicleId",
                table: "Attachment",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Commission_CreateDate",
                table: "Commission",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Commission_DriverId",
                table: "Commission",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Commission_ServiceOrderId",
                table: "Commission",
                column: "ServiceOrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Driver_CreateDate",
                table: "Driver",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Driver_SocialSecurityCard",
                table: "Driver",
                column: "SocialSecurityCard",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FuelLog_CreateDate",
                table: "FuelLog",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_FuelLog_VehicleId",
                table: "FuelLog",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Passenger_CreateDate",
                table: "Passenger",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Passenger_OrderId",
                table: "Passenger",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOrder_CreateDate",
                table: "ServiceOrder",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOrder_DriverId",
                table: "ServiceOrder",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOrder_Number",
                table: "ServiceOrder",
                column: "Number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOrder_OrderId",
                table: "ServiceOrder",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOrder_VehicleId",
                table: "ServiceOrder",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_TripLeg_CreateDate",
                table: "TripLeg",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_TripLeg_OrderId",
                table: "TripLeg",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicle_CreateDate",
                table: "Vehicle",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicle_Plate",
                table: "Vehicle",
                column: "Plate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenance_CreateDate",
                table: "VehicleMaintenance",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenance_ProductId",
                table: "VehicleMaintenance",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleMaintenance_VehicleId",
                table: "VehicleMaintenance",
                column: "VehicleId");

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
                name: "FK_Order_Driver_DriverId",
                table: "Order");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Vehicle_VehicleId",
                table: "Order");

            migrationBuilder.DropTable(
                name: "Commission");

            migrationBuilder.DropTable(
                name: "FuelLog");

            migrationBuilder.DropTable(
                name: "Passenger");

            migrationBuilder.DropTable(
                name: "TripLeg");

            migrationBuilder.DropTable(
                name: "VehicleMaintenance");

            migrationBuilder.DropTable(
                name: "ServiceOrder");

            migrationBuilder.DropTable(
                name: "Driver");

            migrationBuilder.DropTable(
                name: "Vehicle");

            migrationBuilder.DropIndex(
                name: "IX_Order_DriverId",
                table: "Order");

            migrationBuilder.DropIndex(
                name: "IX_Order_VehicleId",
                table: "Order");

            migrationBuilder.DropIndex(
                name: "IX_Attachment_DriverId",
                table: "Attachment");

            migrationBuilder.DropIndex(
                name: "IX_Attachment_VehicleId",
                table: "Attachment");

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

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "Attachment");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "Attachment");
        }
    }
}
