using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TSI.Friday.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAttachmentVehicleMaintenanceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "VehicleMaintenanceId",
                table: "Attachment",
                type: "char(36)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attachment_VehicleMaintenanceId",
                table: "Attachment",
                column: "VehicleMaintenanceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachment_VehicleMaintenance_VehicleMaintenanceId",
                table: "Attachment",
                column: "VehicleMaintenanceId",
                principalTable: "VehicleMaintenance",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachment_VehicleMaintenance_VehicleMaintenanceId",
                table: "Attachment");

            migrationBuilder.DropIndex(
                name: "IX_Attachment_VehicleMaintenanceId",
                table: "Attachment");

            migrationBuilder.DropColumn(
                name: "VehicleMaintenanceId",
                table: "Attachment");
        }
    }
}
