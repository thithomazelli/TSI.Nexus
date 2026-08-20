import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Vehicle, VehicleService } from '@friday/core';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form.component';
import { VehicleMaintenanceListComponent } from '../vehicle-maintenance-list/vehicle-maintenance-list.component';
import { FuelLogListComponent } from '../fuel-log-list/fuel-log-list.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-vehicle-details-page',
    templateUrl: './vehicle-details-page.component.html',
    styleUrl: './vehicle-details-page.component.scss',
    imports: [
        HeaderComponent,
        VehicleFormComponent,
        VehicleMaintenanceListComponent,
        FuelLogListComponent,
        AuditTabComponent,
        TranslatePipe,
    ],
})
export class VehicleDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Vehicle | null = null;
  loading = false;
  activeTab: 'details' | 'maintenances' | 'fuel' | 'audit' = 'details';

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private vehicleService: VehicleService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this._destroy$))
      .subscribe((paramMap) => {
        const idParam = paramMap.get('id');

        if (idParam && idParam !== 'new') {
          this.isEdit = true;
          this.getVehicleById(idParam);
        } else {
          this.isEdit = false;
          this.data = null;
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private getVehicleById(id: string): void {
    this.loading = true;
    this.vehicleService
      .getById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.data == null) {
            this.routerService.navigateByUrl('/not-found');
            return;
          }
          this.data = response.data;
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }
}
