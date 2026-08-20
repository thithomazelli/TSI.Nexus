import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Driver, DriverService, WebApiResponse } from '@friday/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-driver-license-notification',
    templateUrl: './driver-license-notification.component.html',
    styleUrl: './driver-license-notification.component.scss',
    imports: [
        NgIf,
        NgFor,
        RouterLink,
        DatePipe,
        TranslatePipe,
    ],
})
export class DriverLicenseNotificationComponent implements OnInit {
  drivers: Driver[] = [];
  total = 0;

  constructor(
    private driverService: DriverService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.driverService
      .getExpiringLicenses()
      .subscribe((response: WebApiResponse<Driver[]>) => {
        this.drivers = response?.data || [];
        this.total = this.drivers.length;
      });
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  isExpired(driver: Driver): boolean {
    return new Date(driver.licenseExpiryDate) < new Date();
  }

  openDriver(driver: Driver): void {
    this.router.navigateByUrl(`/drivers/${driver.id}`);
  }
}
