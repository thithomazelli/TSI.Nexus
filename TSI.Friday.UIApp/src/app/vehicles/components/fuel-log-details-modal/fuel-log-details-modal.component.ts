import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FuelLog,
  FuelLogService,
  NotificationService,
  ResponseStatus,
} from '@friday/core';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { CurrencyFieldComponent } from '../../../shared/components/currency-field/currency-field.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-fuel-log-details-modal',
    templateUrl: './fuel-log-details-modal.component.html',
    styleUrl: './fuel-log-details-modal.component.scss',
    imports: [
        ReactiveFormsModule,
        DateFieldComponent,
        CurrencyFieldComponent,
        TranslatePipe,
    ],
})
export class FuelLogDetailsModalComponent {
  saving = false;
  isEdit: boolean;
  vehicleId: string;
  private _id: string;
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<FuelLogDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private fuelLogService: FuelLogService,
    private notificationService: NotificationService,
  ) {
    const existing: FuelLog | null = dialogData?.data ?? null;
    this.vehicleId = dialogData?.vehicleId ?? '';
    this.isEdit = !!existing?.id;
    this._id = existing?.id ?? '';

    this.form = this.formBuilder.group({
      date: [existing?.date ?? '', Validators.required],
      odometer: [existing?.odometer ?? 0, [Validators.required, Validators.min(0)]],
      liters: [existing?.liters ?? 0, [Validators.required, Validators.min(0)]],
      pricePerLiter: [
        existing?.pricePerLiter ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      gasStation: [existing?.gasStation ?? ''],
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const fuelLog = {
      // O backend não converte "" para Guid, então o id só entra no payload ao editar.
      ...(this.isEdit ? { id: this._id } : {}),
      date: this.toDate(raw.date),
      odometer: raw.odometer,
      liters: raw.liters,
      pricePerLiter: raw.pricePerLiter,
      totalCost: raw.liters * raw.pricePerLiter,
      gasStation: raw.gasStation,
      vehicleId: this.vehicleId,
    } as FuelLog;

    this.saving = true;
    const request = this.isEdit
      ? this.fuelLogService.update(fuelLog)
      : this.fuelLogService.add(fuelLog);

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
          'Erro ao salvar o abastecimento.',
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
