import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  MaintenanceStatus,
  ModalService,
  NotificationService,
  VehicleMaintenance,
  VehicleMaintenanceService,
  TranslationService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

import { VehicleMaintenanceDetailsModalComponent } from '../vehicle-maintenance-details-modal/vehicle-maintenance-details-modal.component';
import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-vehicle-maintenance-list',
    templateUrl: './vehicle-maintenance-list.component.html',
    styleUrl: './vehicle-maintenance-list.component.scss',
    imports: [
        NgIf,
        CurrencyPipe,
        DatePipe,
        HeaderComponent,
        TranslatePipe,
    ],
})
export class VehicleMaintenanceListComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  vehicleId?: string;

  @Input()
  compact = false;

  maintenances: VehicleMaintenance[] = [];

  get statusMap(): { [key: string]: { label: string; color: string } } {
    return {
      Scheduled: { label: this.translationService.instant('VEHICLES.MAINTENANCE_SCHEDULED'), color: 'info' },
      InProgress: { label: this.translationService.instant('VEHICLES.MAINTENANCE_IN_PROGRESS'), color: 'warning' },
      Completed: { label: this.translationService.instant('VEHICLES.MAINTENANCE_COMPLETED'), color: 'success' },
      Overdue: { label: this.translationService.instant('VEHICLES.MAINTENANCE_OVERDUE'), color: 'danger' },
      Cancelled: { label: this.translationService.instant('VEHICLES.MAINTENANCE_CANCELLED'), color: 'secondary' },
    };
  }

  private _destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private vehicleMaintenanceService: VehicleMaintenanceService,
    private modalService: ModalService,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.vehicleMaintenanceService.maintenanceChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.load());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicleId'] && !changes['vehicleId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  getStatusInfo(status: string): { label: string; color: string } {
    return this.statusMap[status] ?? { label: status, color: 'secondary' };
  }

  openModal(maintenance?: VehicleMaintenance): void {
    this.modalService.showTemplateModal(VehicleMaintenanceDetailsModalComponent, {
      vehicleId: maintenance?.vehicleId ?? this.vehicleId,
      data: maintenance ?? null,
    });
  }

  completeMaintenance(maintenance: VehicleMaintenance): void {
    this.updateStatus(maintenance, MaintenanceStatus.Completed);
  }

  cancelMaintenance(maintenance: VehicleMaintenance): void {
    this.updateStatus(maintenance, MaintenanceStatus.Cancelled);
  }

  private updateStatus(
    maintenance: VehicleMaintenance,
    status: MaintenanceStatus,
  ): void {
    const updated: VehicleMaintenance = { ...maintenance, status };
    this.vehicleMaintenanceService
      .update(updated)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<VehicleMaintenance>) => {
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  private load(): void {
    const request$ = this.vehicleId
      ? this.vehicleMaintenanceService.getByVehicle(this.vehicleId)
      : this.vehicleMaintenanceService.getAll();

    request$.pipe(takeUntil(this._destroy$)).subscribe((response) => {
      this.maintenances = response.data ?? [];
    });
  }
}
