import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ApiType,
  Company,
  Individual,
  ModalService,
  NotificationService,
  Order,
  OrderService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  standalone: false,
})
export class OrdersComponent implements OnInit, OnDestroy {
  @Input()
  compact: boolean = false;

  @Input()
  entity: string | null = '';

  @Input()
  parentData: Individual | Company | null = null;

  baseEndPoint = ApiType.Orders;
  rowData: Order[] = [];
  columnDefs: ColDef[] = [];

  filteredRowData: Order[] = [];
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  filterStatus = {
    Open: false,
    WaitingPayment: false,
    Closed: false,
  };
  showFiltersOnInit = false;

  private _orderChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.setFiltersFromQueryParams();
    this.initializeGrid();

    this._orderChangedSub = this.orderService.orderChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.getOrders(() => this.applyFilters());
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._orderChangedSub) {
      this._orderChangedSub.unsubscribe();
    }
  }

  openModal(initialState: any) {
    if (this.parentData != null) {
      initialState = {
        ...initialState,
        data: <Order>{
          businessPartnerId: this.parentData?.id,
          businessPartnerName: this.parentData?.name,
          orderProducts: [],
        },
      };
    }

    this.modalService.showTemplateModal(
      OrderDetailsModalComponent,
      initialState,
    );
  }

  deleteOrder(order: Order): void {
    this.orderService
      .delete(order)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Order>) => {
        if (response.status === ResponseStatus.Success) {
          this.filteredRowData = this.filteredRowData.filter(
            (p) => p.id !== order.id,
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

  refreshOrders(): void {
    this.getOrders(() => this.applyFilters(), true);
  }

  applyFilters(): void {
    let filtered = [...this.rowData];
    // Filter by date range (start and end) using createDate
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
    // Filter by status (compare directly with status value in EN)
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
        // minWidth: 80,
        hide: true,
      },
      {
        field: 'orderNumber',
        headerName: 'Número do Pedido',
        sortable: true,
        filter: true,
        width: 150,
        resizable: true,
        // minWidth: 150,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          // href="#" prevents full page reload; onCellClicked handles navigation
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
          // href="#" prevents full page reload; onCellClicked handles navigation
          return `<a data-action="view" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'description',
        headerName: 'Descrição',
        sortable: true,
        filter: true,
        flex: 2,
        width: 200,
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
          // Importar OrderStatus corretamente no topo do arquivo se necessário
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
        minWidth: 150,
        sortable: false,
        filter: false,
        maxWidth: 400,
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

  private getOrders(callback?: () => void, isRefresh = false): void {
    let orders$: Observable<WebApiResponse<Order[]>> =
      this.entity != '' && this.parentData?.id != null
        ? this.orderService.getByBusinessPartnerId(this.parentData.id)
        : this.orderService.getAll();

    orders$
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Order[]>) => {
        this.rowData = response.data ?? [];

        if (callback) {
          callback();
        }

        if (isRefresh) {
          this.notificationService.showMessage(
            ResponseStatus.Success,
            'Pedidos atualizados com sucesso',
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
    // Reads filters from URL (query params)
    const params =
      window && window.location && window.location.search
        ? Object.fromEntries(new URLSearchParams(window.location.search))
        : {};

    // Initializes filters
    this.filterStatus = { Open: false, WaitingPayment: false, Closed: false };
    this.filterStartDate = null;
    this.filterEndDate = null;

    // Status filters
    if (params['status']) {
      const statuses = String(params['status']).split(',');
      statuses.forEach((s: string) => {
        if (Object.prototype.hasOwnProperty.call(this.filterStatus, s)) {
          (this.filterStatus as Record<string, boolean>)[s] = true;
        }
      });
    }
    // Date filters
    if (params['startDate']) this.filterStartDate = params['startDate'];
    if (params['endDate']) this.filterEndDate = params['endDate'];

    // Set showFiltersOnInit only on initialization
    this.showFiltersOnInit = this.hasInitialFilters();
  }

  private hasInitialFilters(): boolean {
    // Checks if any filter is active
    if (this.filterStartDate || this.filterEndDate) return true;
    if (Object.values(this.filterStatus).some((v) => v)) return true;
    return false;
  }
}
