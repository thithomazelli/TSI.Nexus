import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  MaintenanceStatus,
  MaintenanceType,
  NotificationService,
  Product,
  ProductService,
  ResponseStatus,
  VehicleMaintenance,
  VehicleMaintenanceService,
} from '@friday/core';

@Component({
  selector: 'app-vehicle-maintenance-details-modal',
  templateUrl: './vehicle-maintenance-details-modal.component.html',
  styleUrl: './vehicle-maintenance-details-modal.component.scss',
  standalone: false,
})
export class VehicleMaintenanceDetailsModalComponent implements OnInit {
  saving = false;
  isEdit: boolean;
  vehicleId: string;
  products: Product[] = [];

  private _id: string;
  private _status: MaintenanceStatus;

  form: FormGroup;

  typeOptions = [
    { label: 'Preventiva', value: MaintenanceType.Preventive },
    { label: 'Corretiva', value: MaintenanceType.Corrective },
  ];

  constructor(
    public dialogRef: MatDialogRef<VehicleMaintenanceDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private vehicleMaintenanceService: VehicleMaintenanceService,
    private notificationService: NotificationService,
  ) {
    const existing: VehicleMaintenance | null = dialogData?.data ?? null;
    this.vehicleId = dialogData?.vehicleId ?? '';
    this.isEdit = !!existing?.id;
    this._id = existing?.id ?? '';
    this._status = existing?.status ?? MaintenanceStatus.Scheduled;

    this.form = this.formBuilder.group({
      type: [existing?.type ?? MaintenanceType.Preventive, Validators.required],
      description: [existing?.description ?? '', Validators.required],
      scheduledDate: [existing?.scheduledDate ?? '', Validators.required],
      cost: [existing?.cost ?? 0, [Validators.min(0)]],
      productId: [existing?.productId ?? (null as string | null)],
      partQuantity: [existing?.partQuantity ?? 0, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.productService.getAll().subscribe((response) => {
      this.products = response.data ?? [];
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
    const maintenance = {
      // O backend não converte "" para Guid, então o id só entra no payload ao editar.
      ...(this.isEdit ? { id: this._id } : {}),
      type: raw.type,
      description: raw.description,
      scheduledDate: this.toDate(raw.scheduledDate),
      cost: raw.cost,
      status: this._status,
      vehicleId: this.vehicleId,
      productId: raw.productId || null,
      partQuantity: raw.productId ? raw.partQuantity : 0,
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
          'Erro ao salvar a manutenção.',
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
