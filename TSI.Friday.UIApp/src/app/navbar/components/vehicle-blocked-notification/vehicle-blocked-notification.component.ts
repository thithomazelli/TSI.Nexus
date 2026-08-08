import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicle, VehicleService, VehicleStatus, WebApiResponse } from '@friday/core';

@Component({
  selector: 'app-vehicle-blocked-notification',
  templateUrl: './vehicle-blocked-notification.component.html',
  styleUrl: './vehicle-blocked-notification.component.scss',
  standalone: false,
})
export class VehicleBlockedNotificationComponent implements OnInit {
  vehicles: Vehicle[] = [];
  total = 0;

  constructor(
    private vehicleService: VehicleService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.vehicleService.getAll().subscribe((response: WebApiResponse<Vehicle[]>) => {
      this.vehicles = (response?.data || []).filter(
        (v) => v.status === VehicleStatus.Blocked,
      );
      this.total = this.vehicles.length;
    });
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  openVehicle(vehicle: Vehicle): void {
    this.router.navigateByUrl(`/vehicles/${vehicle.id}`);
  }
}
