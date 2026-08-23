using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAgendaEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "SelectableOption",
                type: "longtext",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Event",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Title = table.Column<string>(type: "longtext", nullable: true),
                    Description = table.Column<string>(type: "longtext", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EventTypeOptionId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "varchar(255)", nullable: true),
                    BusinessPartnerId = table.Column<Guid>(type: "char(36)", nullable: true),
                    QuoteId = table.Column<Guid>(type: "char(36)", nullable: true),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: true),
                    PurchaseOrderId = table.Column<Guid>(type: "char(36)", nullable: true),
                    TripId = table.Column<Guid>(type: "char(36)", nullable: true),
                    TransactionId = table.Column<Guid>(type: "char(36)", nullable: true),
                    PaymentId = table.Column<Guid>(type: "char(36)", nullable: true),
                    VehicleId = table.Column<Guid>(type: "char(36)", nullable: true),
                    DriverId = table.Column<Guid>(type: "char(36)", nullable: true),
                    VehicleMaintenanceId = table.Column<Guid>(type: "char(36)", nullable: true),
                    FuelLogId = table.Column<Guid>(type: "char(36)", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Event", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Event_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Event_BusinessPartner_BusinessPartnerId",
                        column: x => x.BusinessPartnerId,
                        principalTable: "BusinessPartner",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_Driver_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Driver",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_FuelLog_FuelLogId",
                        column: x => x.FuelLogId,
                        principalTable: "FuelLog",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_Payment_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_PurchaseOrder_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "PurchaseOrder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_Quote_QuoteId",
                        column: x => x.QuoteId,
                        principalTable: "Quote",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_SelectableOption_EventTypeOptionId",
                        column: x => x.EventTypeOptionId,
                        principalTable: "SelectableOption",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Event_Transaction_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_Trip_TripId",
                        column: x => x.TripId,
                        principalTable: "Trip",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_VehicleMaintenance_VehicleMaintenanceId",
                        column: x => x.VehicleMaintenanceId,
                        principalTable: "VehicleMaintenance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Event_Vehicle_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicle",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "EventParticipant",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    EventId = table.Column<Guid>(type: "char(36)", nullable: false),
                    UserId = table.Column<string>(type: "varchar(255)", nullable: true),
                    Name = table.Column<string>(type: "longtext", nullable: true),
                    Email = table.Column<string>(type: "longtext", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreateUserId = table.Column<string>(type: "longtext", nullable: true),
                    ModifyDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ModifyUserId = table.Column<string>(type: "longtext", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventParticipant", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventParticipant_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EventParticipant_Event_EventId",
                        column: x => x.EventId,
                        principalTable: "Event",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Event_BusinessPartnerId",
                table: "Event",
                column: "BusinessPartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_CreateDate",
                table: "Event",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_Event_CreatedByUserId",
                table: "Event",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_DriverId",
                table: "Event",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_EventTypeOptionId",
                table: "Event",
                column: "EventTypeOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_FuelLogId",
                table: "Event",
                column: "FuelLogId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_OrderId",
                table: "Event",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_PaymentId",
                table: "Event",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_PurchaseOrderId",
                table: "Event",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_QuoteId",
                table: "Event",
                column: "QuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_TransactionId",
                table: "Event",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_TripId",
                table: "Event",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_VehicleId",
                table: "Event",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_VehicleMaintenanceId",
                table: "Event",
                column: "VehicleMaintenanceId");

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipant_CreateDate",
                table: "EventParticipant",
                column: "CreateDate");

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipant_EventId",
                table: "EventParticipant",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipant_UserId",
                table: "EventParticipant",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventParticipant");

            migrationBuilder.DropTable(
                name: "Event");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "SelectableOption");
        }
    }
}
