import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FuelLog,
  FuelLogService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@friday/core';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { Subject, takeUntil } from 'rxjs';
import { NgIf } from '@angular/common';

import { FuelLogDetailsModalComponent } from '../fuel-log-details-modal/fuel-log-details-modal.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { GridComponent } from '../../../shared/grid/grid.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-fuel-log-list',
    templateUrl: './fuel-log-list.component.html',
    styleUrl: './fuel-log-list.component.scss',
    imports: [
        NgIf,
        HeaderComponent,
        GridComponent,
        TranslatePipe,
    ],
})
export class FuelLogListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  vehicleId?: string;

  @Input()
  compact = false;

  baseEndPoint = 'fuel-logs';
  rowData: FuelLog[] = [];
  columnDefs: ColDef[] = [];

  statusColorMap: { [key: string]: string } = {
    'Concluído': 'success',
    'Agendado': 'info',
    'Cancelado': 'secondary',
  };

  private _destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private fuelLogService: FuelLogService,
    private modalService: ModalService,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    this.initializeGrid();
    this.translationService.language$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.initializeGrid());
    this.load();
    this.fuelLogService.fuelLogChanged$
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

  openModal(initialState: any): void {
    this.modalService.showTemplateModal(FuelLogDetailsModalComponent, {
      ...initialState,
      vehicleId: initialState?.data?.vehicleId ?? this.vehicleId,
    });
  }

  removeFuelLog(fuelLog: FuelLog): void {
    this.fuelLogService
      .delete(fuelLog)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<FuelLog>) => {
        if (response.status === ResponseStatus.Success) {
          this.rowData = this.rowData.filter((f) => f.id !== fuelLog.id);
        }
        this.modalService.hideModal();
        this.modalService.showSweetNotification('', response.message, response.status);
      });
  }

  refresh(): void {
    this.load(true);
  }

  private initializeGrid(): void {
    this.columnDefs = [
      {
        field: 'id',
        headerName: 'ID',
        sortable: true,
        filter: true,
        hide: true,
      },
      {
        field: 'vehicle.plate',
        headerName: this.translationService.instant('VEHICLES.SINGULAR'),
        sortable: true,
        filter: true,
        flex: 1,
        hide: !!this.vehicleId,
      },
      {
        field: 'date',
        headerName: this.translationService.instant('COMMON.DATE'),
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (params: ValueFormatterParams) => this.formatDateBR(params.value),
      },
      {
        field: 'odometer',
        headerName: this.translationService.instant('VEHICLES.ODOMETER_SHORT'),
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        field: 'liters',
        headerName: this.translationService.instant('VEHICLES.LITERS'),
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        field: 'pricePerLiter',
        headerName: this.translationService.instant('VEHICLES.PRICE_PER_LITER'),
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (params: ValueFormatterParams) => this.formatCurrency(params.value),
      },
      {
        field: 'totalCost',
        headerName: this.translationService.instant('COMMON.TOTAL'),
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (params: ValueFormatterParams) => this.formatCurrency(params.value),
      },
      {
        field: 'gasStation',
        headerName: this.translationService.instant('VEHICLES.GAS_STATION'),
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        field: 'status',
        headerName: this.translationService.instant('COMMON.STATUS'),
        sortable: true,
        filter: true,
        flex: 1,
        cellRenderer: (params: ICellRendererParams) => {
          const color = this.statusColorMap[params.value] ?? 'secondary';
          return `<span class="badge bg-${color}">${params.value ?? ''}</span>`;
        },
      },
      {
        headerName: this.translationService.instant('COMMON.ACTIONS'),
        flex: 1,
        minWidth: 100,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: () => {
          return `
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
  }

  private load(isRefresh = false): void {
    const request$ = this.vehicleId
      ? this.fuelLogService.getByVehicle(this.vehicleId)
      : this.fuelLogService.getAll();

    request$.pipe(takeUntil(this._destroy$)).subscribe((response) => {
      this.rowData = response.data ?? [];
      if (isRefresh) {
        this.notificationService.showMessage(response.status, response.message);
      }
    });
  }

  private formatCurrency(value: any): string {
    if (value == null || value === '') return '';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatDateBR(date: string | Date): string {
    if (!date) {
      return '';
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
