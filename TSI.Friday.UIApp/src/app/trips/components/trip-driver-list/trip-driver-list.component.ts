import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  Driver,
  DriverService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TripDriver,
  TripDriverService,
  TranslationService,
  WebApiResponse,
} from '@friday/core';
import { Observable, Subject, startWith, takeUntil, map } from 'rxjs';

import { DriverDetailsModalComponent } from '../../../drivers/components/driver-details-modal/driver-details-modal.component';

@Component({
  selector: 'app-trip-driver-list',
  templateUrl: './trip-driver-list.component.html',
  styleUrl: './trip-driver-list.component.scss',
  standalone: false,
})
export class TripDriverListComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  tripId!: string;

  tripDrivers: TripDriver[] = [];
  drivers: Driver[] = [];

  inlineTripDriverForm!: FormGroup;
  filteredInlineDriversByName$!: Observable<Driver[]>;

  private _destroy$ = new Subject<void>();

  constructor(
    private driverService: DriverService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
    private tripDriverService: TripDriverService,
  ) {}

  ngOnInit(): void {
    this.setupInlineTripDriverForm();
    this.loadDrivers();
    this.load();
    this.tripDriverService.tripDriverChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.load());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripId'] && !changes['tripId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  async onInlineDriverNameBlur(): Promise<void> {
    setTimeout(() => {
      const driverName = this.inlineTripDriverForm
        .get('driverName')!
        .value?.trim();
      if (!driverName) {
        this.cleanInlineTripDriverSelection();
        return;
      }
      const found = this.drivers.find((d) => d.name === driverName);
      if (found) {
        return;
      }
      const entityLabel = this.translationService.instant('SIDEBAR.DRIVER');
      const confirmRef = this.modalService.showConfirmation({
        title: this.translationService.instant('COMMON.ENTITY_NOT_FOUND', { entity: entityLabel }),
        message: this.translationService.instant('COMMON.CONFIRM_ADD_ENTITY', { entityLower: entityLabel.toLowerCase(), name: driverName }),
        cancelButtonText: this.translationService.instant('COMMON.CANCEL'),
        confirmButtonText: this.translationService.instant('COMMON.YES'),
      });
      confirmRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          const driverFormRef: MatDialogRef<any> = this.modalService.showTemplateModal(
            DriverDetailsModalComponent,
            {
              data: { name: driverName },
              disableClose: true,
            },
          );
          driverFormRef
            .afterClosed()
            .pipe(takeUntil(this._destroy$))
            .subscribe((result: WebApiResponse<Driver> | undefined) => {
              if (result?.data) {
                this.drivers.push(result.data);
                this.selectInlineTripDriver(result.data);
              } else {
                this.cleanInlineTripDriverSelection();
              }
            });
        } else {
          this.cleanInlineTripDriverSelection();
        }
      });
    }, 200);
  }

  selectInlineTripDriver(driver: Driver): void {
    if (!driver) {
      return;
    }

    const alreadyAdded = this.tripDrivers.some(
      (td) => td.driverId === driver.id,
    );
    if (alreadyAdded) {
      this.modalService.showNotification(
        false,
        this.translationService.instant('TRIPS.DRIVER_ALREADY_ADDED_TITLE'),
        this.translationService.instant('TRIPS.DRIVER_ALREADY_ADDED_MESSAGE', { name: driver.name + '' }),
      );
      this.cleanInlineTripDriverSelection();
      return;
    }

    this.inlineTripDriverForm.patchValue({
      driverId: driver.id,
      driverName: driver.name,
      driverLicenseNumber: driver.licenseNumber,
      driverLicenseExpiryDate: driver.licenseExpiryDate,
    });
  }

  addInlineTripDriver(): void {
    const raw = this.inlineTripDriverForm.getRawValue();
    if (!raw.driverId || !this.tripId) {
      return;
    }

    const tripDriver = {
      tripId: this.tripId,
      driverId: raw.driverId,
      amount: Number(raw.amount) || 0,
    } as TripDriver;

    this.tripDriverService
      .add(tripDriver)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<TripDriver>) => {
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.cleanInlineTripDriverSelection();
        }
      });
  }

  onAmountBlur(tripDriver: TripDriver): void {
    this.tripDriverService
      .update(tripDriver)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<TripDriver>) => {
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  removeTripDriver(tripDriver: TripDriver): void {
    this.tripDriverService
      .delete(tripDriver)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<TripDriver>) => {
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  private setupInlineTripDriverForm(): void {
    this.inlineTripDriverForm = this.formBuilder.group({
      driverId: [null],
      driverName: [''],
      driverLicenseNumber: [''],
      driverLicenseExpiryDate: [null as Date | null],
      amount: [0],
    });

    this.filteredInlineDriversByName$ = this.inlineTripDriverForm
      .get('driverName')!
      .valueChanges.pipe(
        startWith(''),
        map((value: string | Driver) => {
          // mat-autocomplete briefly writes the selected option's whole object (not just its
          // string label) back through this same control before selectInlineTripDriver()
          // overwrites it with driver.name - guard against that non-string value the same way
          // order-form's inline SKU filter already does.
          const filterValue = (
            typeof value === 'string' ? value : ''
          ).toLowerCase();
          if (!filterValue) {
            return [];
          }
          return this.drivers.filter((driver) =>
            (driver.name || '').toLowerCase().includes(filterValue),
          );
        }),
      );
  }

  private cleanInlineTripDriverSelection(): void {
    this.inlineTripDriverForm.reset({
      driverId: null,
      driverName: '',
      driverLicenseNumber: '',
      driverLicenseExpiryDate: null,
      amount: 0,
    });
  }

  private loadDrivers(): void {
    this.driverService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.drivers = response.data ?? [];
      });
  }

  private load(): void {
    if (!this.tripId) {
      return;
    }
    this.tripDriverService
      .getByTripId(this.tripId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.tripDrivers = response.data ?? [];
      });
  }
}
