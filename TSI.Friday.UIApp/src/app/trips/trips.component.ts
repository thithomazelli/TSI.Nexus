import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ApiType,
  Company,
  Individual,
  ModalService,
  NotificationService,
  Trip,
  TripService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { TripDetailsModalComponent } from './components/trip-details-modal/trip-details-modal.component';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.scss',
  standalone: false,
})
export class TripsComponent implements OnInit, OnDestroy {
  @Input()
  compact: boolean = false;

  @Input()
  entity: string | null = '';

  @Input()
  parentData: Individual | Company | null = null;

  baseEndPoint = ApiType.Trips;
  rowData: Trip[] = [];
  columnDefs: ColDef[] = [];

  filteredRowData: Trip[] = [];
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  filterStatus = {
    Open: false,
    WaitingPayment: false,
    Closed: false,
  };
  showFiltersOnInit = false;

  private _tripChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private tripService: TripService,
  ) {}

  ngOnInit(): void {
    this.setFiltersFromQueryParams();
    this.initializeGrid();

    this._tripChangedSub = this.tripService.tripChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.getTrips(() => this.applyFilters());
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._tripChangedSub) {
      this._tripChangedSub.unsubscribe();
    }
  }

  openModal(initialState: any) {
    if (this.parentData != null) {
      initialState = {
        ...initialState,
        data: <Trip>{
          businessPartnerId: this.parentData?.id,
          businessPartnerName: this.parentData?.name,
        },
      };
    }

    this.modalService.showTemplateModal(
      TripDetailsModalComponent,
      initialState,
    );
  }

  deleteTrip(trip: Trip): void {
    this.tripService
      .delete(trip)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Trip>) => {
        if (response.status === ResponseStatus.Success) {
          this.filteredRowData = this.filteredRowData.filter(
            (p) => p.id !== trip.id,
          );
        }
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          response.status,
        );
      });
  }

  refreshTrips(): void {
    this.getTrips(() => this.applyFilters(), true);
  }

  applyFilters(): void {
    let filtered = [...this.rowData];
    if (this.filterStartDate || this.filterEndDate) {
      filtered = filtered.filter((item) => {
        if (!item.createDate) return false;
        const itemDate = new Date(item.createDate).toISOString().slice(0, 10);
        let isValid = true;
        if (this.filterStartDate) {
          const startDate = new Date(this.filterStartDate)
            .toISOString()
            .slice(0, 10);
          isValid = isValid && itemDate >= startDate;
        }
        if (this.filterEndDate) {
          const endDate = new Date(this.filterEndDate)
            .toISOString()
            .slice(0, 10);
          isValid = isValid && itemDate <= endDate;
        }
        return isValid;
      });
    }
    const selectedStatuses = Object.entries(this.filterStatus)
      .filter(([_, checked]) => checked)
      .map(([label]) => label);
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatuses.includes(item.status ?? ''),
      );
    }
    this.filteredRowData = filtered;
  }

  clearFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterStatus = {
      Open: false,
      WaitingPayment: false,
      Closed: false,
    };
    this.filteredRowData = [...this.rowData];
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
        field: 'tripNumber',
        headerName: 'Número da Viagem',
        sortable: true,
        filter: true,
        width: 150,
        resizable: true,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="view" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'businessPartnerName',
        headerName: 'Nome do Cliente',
        sortable: true,
        filter: true,
        flex: 1,
        hide: this.entity === 'BusinessPartner',
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="view" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'route',
        headerName: 'Roteiro',
        sortable: true,
        filter: true,
        flex: 2,
        width: 200,
      },
      {
        field: 'vehiclePlate',
        headerName: 'Veículo',
        sortable: true,
        filter: true,
        width: 120,
      },
      {
        field: 'driverName',
        headerName: 'Motorista',
        sortable: true,
        filter: true,
        width: 150,
      },
      {
        field: 'totalPrice',
        headerName: 'Valor Total',
        sortable: true,
        filter: true,
        width: 120,
        cellClass: 'text-start',
        valueFormatter: (params: ValueFormatterParams): string => {
          const v = params.value;
          if (v == null || v === '') return '';
          const n = Number(v);
          if (Number.isNaN(n)) return String(v);
          return n.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });
        },
      },
      {
        field: 'date',
        headerName: 'Data',
        sortable: true,
        filter: true,
        flex: 2,
        minWidth: 160,
        valueFormatter: (params: ValueFormatterParams) =>
          this.formatDateBR(params.value),
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        filter: true,
        flex: 2,
        width: 80,
        cellRenderer: (params: ICellRendererParams) => {
          const value = params.value;
          let color = 'secondary';
          let label = value;
          if (value === 'Closed') {
            color = 'success';
            label = 'Fechado';
          } else if (value === 'Open') {
            color = 'info';
            label = 'Em Aberto';
          } else if (value === 'WaitingPayment') {
            color = 'warning';
            label = 'Aguardando Pagamento';
          }
          return `<span class="badge bg-${color}">${label}</span>`;
        },
      },
      {
        headerName: 'Ações',
        flex: 1,
        minWidth: 150,
        sortable: false,
        filter: false,
        resizable: true,
        width: 280,
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
  }

  private getTrips(callback?: () => void, isRefresh = false): void {
    let trips$: Observable<WebApiResponse<Trip[]>> =
      this.entity != '' && this.parentData?.id != null
        ? this.tripService.getByBusinessPartnerId(this.parentData.id)
        : this.tripService.getAll();

    trips$
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Trip[]>) => {
        this.rowData = response.data ?? [];

        if (callback) {
          callback();
        }

        if (isRefresh) {
          this.notificationService.showMessage(
            ResponseStatus.Success,
            'Viagens atualizadas com sucesso',
          );
        }
      });
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

  private setFiltersFromQueryParams(): void {
    const params =
      window && window.location && window.location.search
        ? Object.fromEntries(new URLSearchParams(window.location.search))
        : {};

    this.filterStatus = { Open: false, WaitingPayment: false, Closed: false };
    this.filterStartDate = null;
    this.filterEndDate = null;

    if (params['status']) {
      const statuses = String(params['status']).split(',');
      statuses.forEach((s: string) => {
        if (Object.prototype.hasOwnProperty.call(this.filterStatus, s)) {
          (this.filterStatus as Record<string, boolean>)[s] = true;
        }
      });
    }
    if (params['startDate']) this.filterStartDate = params['startDate'];
    if (params['endDate']) this.filterEndDate = params['endDate'];

    this.showFiltersOnInit = this.hasInitialFilters();
  }

  private hasInitialFilters(): boolean {
    if (this.filterStartDate || this.filterEndDate) return true;
    if (Object.values(this.filterStatus).some((v) => v)) return true;
    return false;
  }
}
