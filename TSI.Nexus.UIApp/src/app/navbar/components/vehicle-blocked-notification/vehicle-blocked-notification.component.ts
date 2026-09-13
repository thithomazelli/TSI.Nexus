import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalService, Vehicle, VehicleService, VehicleStatus, WebApiResponse } from '@nexus/core';
import { NgIf, NgFor } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { VehicleDetailsModalComponent } from '../../../vehicles/components/vehicle-details-modal/vehicle-details-modal.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-vehicle-blocked-notification',
    templateUrl: './vehicle-blocked-notification.component.html',
    styleUrl: './vehicle-blocked-notification.component.scss',
    imports: [
        NgIf,
        NgFor,
        RouterLink,
        TranslatePipe,
    ],
})
export class VehicleBlockedNotificationComponent implements OnInit {
  vehicles: Vehicle[] = [];
  total = 0;

  constructor(
    private vehicleService: VehicleService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.vehicleService.getAll().subscribe((response: WebApiResponse<Vehicle[]>) => {
      this.vehicles = (response?.data || []).filter(
        (v) => v.status === VehicleStatus.Blocked,
      );
      this.total = this.vehicles.length;
      this.cdr.markForCheck();
    });
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  // Caps what actually renders - the dropdown has no natural height limit otherwise, and with
  // enough blocked vehicles it would grow past the viewport with no way to scroll to the footer
  // link below it (see .notification-list in the stylesheet for the scroll fallback).
  get displayVehicles(): Vehicle[] {
    return this.vehicles.slice(0, 10);
  }

  openVehicle(vehicle: Vehicle): void {
    this.modalService.showTemplateModal(VehicleDetailsModalComponent, {
      isEdit: true,
      id: vehicle.id,
      data: vehicle,
    });
  }
}
