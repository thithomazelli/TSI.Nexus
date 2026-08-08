import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  MaintenanceStatus,
  MaintenanceType,
  NotificationService,
  ResponseStatus,
  VehicleMaintenance,
  VehicleMaintenanceService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

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
  showForm = false;
  form!: ReturnType<FormBuilder['group']>;

  typeOptions = [
    { label: 'Preventiva', value: MaintenanceType.Preventive },
    { label: 'Corretiva', value: MaintenanceType.Corrective },
  ];

  statusMap: { [key: string]: { label: string; color: string } } = {
    Scheduled: { label: 'Agendada', color: 'info' },
    InProgress: { label: 'Em andamento', color: 'warning' },
    Completed: { label: 'Concluída', color: 'success' },
    Overdue: { label: 'Vencida', color: 'danger' },
    Cancelled: { label: 'Cancelada', color: 'secondary' },
  };

  private _destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private vehicleMaintenanceService: VehicleMaintenanceService,
  ) {
    this.form = this.formBuilder.group({
      type: [MaintenanceType.Preventive, Validators.required],
      description: ['', Validators.required],
      scheduledDate: [
        new Date().toISOString().substring(0, 10),
        Validators.required,
      ],
      cost: [0, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.load();
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

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  addMaintenance(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const maintenance = {
      id: '',
      type: raw.type,
      description: raw.description,
      scheduledDate: raw.scheduledDate,
      cost: raw.cost,
      status: MaintenanceStatus.Scheduled,
      vehicleId: this.vehicleId,
    } as VehicleMaintenance;

    this.vehicleMaintenanceService
      .add(maintenance)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<VehicleMaintenance>) => {
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.showForm = false;
          this.form.reset({
            type: MaintenanceType.Preventive,
            description: '',
            scheduledDate: new Date().toISOString().substring(0, 10),
            cost: 0,
          });
          this.load();
        }
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
        this.load();
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
