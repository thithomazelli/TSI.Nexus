import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslationService, Vehicle, VehicleService } from '@nexus/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form.component';
import { VehicleMaintenanceListComponent } from '../vehicle-maintenance-list/vehicle-maintenance-list.component';
import { FuelLogListComponent } from '../fuel-log-list/fuel-log-list.component';
import { TripsComponent } from '../../../trips/trips.component';
import { AttachmentsComponent } from '../../../shared/attachments/attachments.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { EventListComponent } from '../../../shared/components/event-list/event-list.component';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { FeatureToggleKeys } from '../../../core/models/feature-toggle.model';
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
        TripsComponent,
        AttachmentsComponent,
        AuditTabComponent,
        EventListComponent,
        TranslatePipe,
    ],
})
export class VehicleDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Vehicle | null = null;
  loading = false;
  isAgendaEnabled = true;
  activeTab:
    | 'details'
    | 'maintenances'
    | 'fuel'
    | 'trips'
    | 'attachments'
    | 'agenda'
    | 'audit' = 'details';

  get statusMap(): { [key: string]: string } {
    return {
      Available: this.translationService.instant('VEHICLES.STATUS_AVAILABLE'),
      InMaintenance: this.translationService.instant('VEHICLES.STATUS_IN_MAINTENANCE'),
      Blocked: this.translationService.instant('VEHICLES.STATUS_BLOCKED'),
      Inactive: this.translationService.instant('VEHICLES.STATUS_INACTIVE'),
    };
  }

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private translationService: TranslationService,
    private vehicleService: VehicleService,
    private routerService: Router,
    private featureFlagService: FeatureFlagService,
  ) {}

  getStatusLabel(): string {
    if (!this.data?.status) {
      return '';
    }
    return this.statusMap[this.data.status] || '';
  }

  ngOnInit(): void {
    combineLatest([
      this.featureFlagService.isEnabled(FeatureToggleKeys.AgendaModule),
      this.featureFlagService.isEnabled(FeatureToggleKeys.Event),
    ])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([groupEnabled, entityEnabled]) => {
        this.isAgendaEnabled = groupEnabled && entityEnabled;
      });
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
