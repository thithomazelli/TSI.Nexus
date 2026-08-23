import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  MaintenanceStatus,
  MaintenanceType,
  NotificationService,
  ResponseStatus,
  VehicleMaintenance,
  VehicleMaintenanceProduct,
  VehicleMaintenanceService,
  TranslationService,
} from '@friday/core';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { CurrencyFieldComponent } from '../../../shared/components/currency-field/currency-field.component';
import { ProductPickerGridComponent } from '../../../shared/components/product-picker-grid/product-picker-grid.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-vehicle-maintenance-details-modal',
    templateUrl: './vehicle-maintenance-details-modal.component.html',
    styleUrl: './vehicle-maintenance-details-modal.component.scss',
    imports: [
        ReactiveFormsModule,
        DateFieldComponent,
        CurrencyFieldComponent,
        ProductPickerGridComponent,
        TranslatePipe,
    ],
})
export class VehicleMaintenanceDetailsModalComponent implements OnInit {
  saving = false;
  isEdit: boolean;
  vehicleId: string;
  vehicleMaintenanceProducts: VehicleMaintenanceProduct[] = [];

  private _id: string;

  form: FormGroup;

  get typeOptions() {
    return [
      { label: this.translationService.instant('VEHICLES.PREVENTIVE'), value: MaintenanceType.Preventive },
      { label: this.translationService.instant('VEHICLES.CORRECTIVE'), value: MaintenanceType.Corrective },
    ];
  }

  get statusOptions() {
    return [
      { label: this.translationService.instant('VEHICLES.MAINTENANCE_SCHEDULED'), value: MaintenanceStatus.Scheduled },
      { label: this.translationService.instant('VEHICLES.MAINTENANCE_IN_PROGRESS'), value: MaintenanceStatus.InProgress },
      { label: this.translationService.instant('VEHICLES.MAINTENANCE_COMPLETED'), value: MaintenanceStatus.Completed },
      { label: this.translationService.instant('VEHICLES.MAINTENANCE_OVERDUE'), value: MaintenanceStatus.Overdue },
      { label: this.translationService.instant('VEHICLES.MAINTENANCE_CANCELLED'), value: MaintenanceStatus.Cancelled },
    ];
  }

  constructor(
    public dialogRef: MatDialogRef<VehicleMaintenanceDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private vehicleMaintenanceService: VehicleMaintenanceService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
  ) {
    const existing: VehicleMaintenance | null = dialogData?.data ?? null;
    this.vehicleId = dialogData?.vehicleId ?? '';
    this.isEdit = !!existing?.id;
    this._id = existing?.id ?? '';
    this.vehicleMaintenanceProducts = [...(existing?.vehicleMaintenanceProducts ?? [])];

    this.form = this.formBuilder.group({
      type: [existing?.type ?? MaintenanceType.Preventive, Validators.required],
      description: [existing?.description ?? '', Validators.required],
      scheduledDate: [existing?.scheduledDate ?? '', Validators.required],
      cost: [existing?.cost ?? 0, [Validators.min(0)]],
      status: [existing?.status ?? MaintenanceStatus.Scheduled, Validators.required],
    });
  }

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close(null);
  }

  onProductPickerItemAdded(item: VehicleMaintenanceProduct): void {
    this.vehicleMaintenanceProducts.push(item);
  }

  removeProduct(index: number): void {
    this.vehicleMaintenanceProducts.splice(index, 1);
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const maintenance = {
      // O backend não converte "" para Guid, então o id só entra no payload ao editar.
      ...(this.isEdit ? { id: this._id } : {}),
      type: raw.type,
      description: raw.description,
      scheduledDate: this.toDate(raw.scheduledDate),
      cost: raw.cost,
      status: raw.status,
      vehicleId: this.vehicleId,
      vehicleMaintenanceProducts: this.vehicleMaintenanceProducts,
    } as VehicleMaintenance;

    this.saving = true;
    const request = this.isEdit
      ? this.vehicleMaintenanceService.update(maintenance)
      : this.vehicleMaintenanceService.add(maintenance);

    request.subscribe({
      next: (response) => {
        this.saving = false;
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.dialogRef.close(response);
        }
      },
      error: () => {
        this.saving = false;
        this.notificationService.showMessage(
          ResponseStatus.Error,
          this.translationService.instant('VEHICLES.SAVE_MAINTENANCE_ERROR'),
        );
      },
    });
  }

  /**
   * app-date-field yields a "DD/MM/YYYY" string when typed manually, a Moment/Date instance when
   * picked from the calendar, or the original ISO string/Date when left untouched during edit.
   */
  private toDate(dateOnly: any): Date {
    if (!dateOnly) {
      return new Date();
    }
    if (typeof dateOnly === 'object' && typeof dateOnly.toDate === 'function') {
      return dateOnly.toDate();
    }
    if (dateOnly instanceof Date) {
      return dateOnly;
    }
    const str = String(dateOnly);
    if (str.includes('/')) {
      const [day, month, year] = str.split('/').map((part) => Number(part));
      return new Date(year, (month || 1) - 1, day || 1);
    }
    return new Date(str);
  }
}
