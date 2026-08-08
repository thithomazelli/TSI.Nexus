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
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

import { VehicleMaintenanceDetailsModalComponent } from '../vehicle-maintenance-details-modal/vehicle-maintenance-details-modal.component';

@Component({
  selector: 'app-vehicle-maintenance-list',
  templateUrl: './vehicle-maintenance-list.component.html',
  styleUrl: './vehicle-maintenance-list.component.scss',
  standalone: false,
})
export class VehicleMaintenanceListComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  vehicleId!: string;

  maintenances: VehicleMaintenance[] = [];

  statusMap: { [key: string]: { label: string; color: string } } = {
    Scheduled: { label: 'Agendada', color: 'info' },
    InProgress: { label: 'Em andamento', color: 'warning' },
    Completed: { label: 'Concluída', color: 'success' },
    Overdue: { label: 'Vencida', color: 'danger' },
    Cancelled: { label: 'Cancelada', color: 'secondary' },
  };

  private _destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private vehicleMaintenanceService: VehicleMaintenanceService,
    private modalService: ModalService,
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
      vehicleId: this.vehicleId,
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
    if (!this.vehicleId) {
      return;
    }
    this.vehicleMaintenanceService
      .getByVehicle(this.vehicleId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.maintenances = response.data ?? [];
      });
  }
}
