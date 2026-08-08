import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  Vehicle,
  VehicleService,
  WebApiResponse,
} from '@friday/core';
import { Subscription, tap, Subject, takeUntil } from 'rxjs';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

import { VehicleDetailsModalComponent } from './components/vehicle-details-modal/vehicle-details-modal.component';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
  standalone: false,
})
export class VehiclesComponent implements OnInit, OnDestroy {
  private _vehicleChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  baseEndPoint = 'vehicles';

  typeMap: { [key: string]: string } = {
    Bus: 'Ônibus',
    MiniBus: 'Micro-ônibus',
    Van: 'Van',
    Car: 'Carro',
    Other: 'Outro',
  };

  statusMap: { [key: string]: { label: string; color: string } } = {
    Available: { label: 'Disponível', color: 'success' },
    InMaintenance: { label: 'Em manutenção', color: 'warning' },
    Blocked: { label: 'Bloqueado', color: 'danger' },
    Inactive: { label: 'Inativo', color: 'secondary' },
  };

  rowData: Vehicle[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      hide: true,
    },
    {
      field: 'plate',
      headerName: 'Placa',
      width: 110,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'brand',
      headerName: 'Marca',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'model',
      headerName: 'Modelo',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'seatCapacity',
      headerName: 'Lugares',
      maxWidth: 110,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      maxWidth: 140,
      valueFormatter: (params: ValueFormatterParams) =>
        this.typeMap[params.value] ?? params.value ?? '',
    },
    {
      field: 'status',
      headerName: 'Status',
      maxWidth: 150,
      cellRenderer: (params: ICellRendererParams) => {
        const info = this.statusMap[params.value] ?? {
          label: params.value,
          color: 'secondary',
        };
        return `<span class="badge bg-${info.color}">${info.label}</span>`;
      },
    },
    {
      field: 'pricePerKm',
      headerName: 'R$/km',
      maxWidth: 110,
      valueFormatter: (params: ValueFormatterParams) =>
        this.formatCurrency(params.value),
    },
    {
      field: 'dailyRate',
      headerName: 'Diária',
      maxWidth: 110,
      valueFormatter: (params: ValueFormatterParams) =>
        this.formatCurrency(params.value),
    },
    {
      headerName: 'Ações',
      minWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: () => {
        return `
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-eye" data-action="view"></i>
          </button>
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit" data-action="edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash" data-action="delete"></i>
          </button>
        `;
      },
    },
  ];

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private vehicleService: VehicleService,
  ) {}

  openModal(initialState: any): void {
    this.modalService.showTemplateModal(
      VehicleDetailsModalComponent,
      initialState,
    );
  }

  ngOnInit(): void {
    this.getVehicles();
    this._vehicleChangedSub = this.vehicleService.vehicleChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.getVehicles());
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._vehicleChangedSub) {
      this._vehicleChangedSub.unsubscribe();
    }
  }

  deleteVehicle(vehicle: Vehicle): void {
    this.vehicleService
      .delete(vehicle)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Vehicle>) => {
        if (response.status === ResponseStatus.Success) {
          this.rowData = this.rowData.filter((v) => v.id !== vehicle.id);
        }
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  refreshVehicles(): void {
    this.vehicleService
      .refresh()
      .pipe(
        tap({
          next: () =>
            this.notificationService.showMessage(
              ResponseStatus.Success,
              'Veículos atualizados com sucesso',
            ),
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao atualizar veículos',
            ),
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<Vehicle[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private formatCurrency(value: number): string {
    if (value == null || value === ('' as unknown as number)) {
      return '';
    }
    const n = Number(value);
    if (Number.isNaN(n)) {
      return String(value);
    }
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private getVehicles(): void {
    this.vehicleService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Vehicle[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
