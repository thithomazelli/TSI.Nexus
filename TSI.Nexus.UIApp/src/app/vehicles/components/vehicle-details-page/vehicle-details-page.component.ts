import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AgendaEvent,
  TranslationService,
  Trip,
  TripLegService,
  TripService,
  Vehicle,
  VehicleService,
} from '@nexus/core';
import { combineLatest, forkJoin, map, of, Subject, switchMap, takeUntil, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { PhotoComponent } from '../../../shared/photo/photo.component';
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
        PhotoComponent,
        AsyncPipe,
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
  // Read via the async pipe in the template rather than subscribed into a plain field: no
  // manual Subscription/ngOnDestroy bookkeeping, and the async pipe treats "no emission yet" as
  // falsy, so the tab stays out of the DOM until the real state is known instead of a guessed
  // default flashing on screen first.
  isAgendaEnabled$!: Observable<boolean>;
  tripAgendaEvents: AgendaEvent[] = [];
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
    private tripService: TripService,
    private tripLegService: TripLegService,
    private routerService: Router,
    private featureFlagService: FeatureFlagService,
  ) {
    this.isAgendaEnabled$ = combineLatest([
      this.featureFlagService.isEnabled(FeatureToggleKeys.AgendaModule),
      this.featureFlagService.isEnabled(FeatureToggleKeys.Event),
    ]).pipe(map(([groupEnabled, entityEnabled]) => groupEnabled && entityEnabled));
  }

  getStatusLabel(): string {
    if (!this.data?.status) {
      return '';
    }
    return this.statusMap[this.data.status] || '';
  }

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
          this.loadTripAgendaEvents(id);
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }

  // Builds the Agenda tab's read-only trip cards (see TripService.buildAgendaEvent) - each
  // Trip's own legs have to be fetched separately (TripLegs are never eager-loaded onto a Trip,
  // same as everywhere else legs are used - see trip-leg-list.component.ts) so this is one
  // request per trip; a vehicle's own trip history is small enough that this bounded fan-out is
  // simpler than adding a bulk endpoint for a single tab.
  private loadTripAgendaEvents(vehicleId: string): void {
    this.tripService
      .getByVehicleId(vehicleId)
      .pipe(
        switchMap((response) => {
          const trips = response.data ?? [];
          if (trips.length === 0) {
            return of([] as AgendaEvent[]);
          }
          return forkJoin(
            trips
              .filter((trip: Trip) => !!trip.id)
              .map((trip: Trip) =>
                this.tripLegService.getByTrip(trip.id!).pipe(
                  switchMap((legsResponse) =>
                    of(this.tripService.buildAgendaEvent(trip, legsResponse.data ?? [])),
                  ),
                ),
              ),
          );
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((events) => {
        this.tripAgendaEvents = events;
      });
  }
}
