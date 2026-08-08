import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicle, VehicleService, WebApiResponse } from '@friday/core';

@Component({
  selector: 'app-vehicle-license-notification',
  templateUrl: './vehicle-license-notification.component.html',
  styleUrl: './vehicle-license-notification.component.scss',
  standalone: false,
})
export class VehicleLicenseNotificationComponent implements OnInit {
  vehicles: Vehicle[] = [];
  total = 0;

  constructor(
    private vehicleService: VehicleService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.vehicleService
      .getExpiringLicenses(60)
      .subscribe((response: WebApiResponse<Vehicle[]>) => {
        this.vehicles = response?.data || [];
        this.total = this.vehicles.length;
      });
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  isExpired(vehicle: Vehicle): boolean {
    if (!vehicle.transportLicenseExpiryDate) {
      return false;
    }
    return new Date(vehicle.transportLicenseExpiryDate) < new Date();
  }

  openVehicle(vehicle: Vehicle): void {
    this.router.navigateByUrl(`/vehicles/${vehicle.id}`);
  }
}
