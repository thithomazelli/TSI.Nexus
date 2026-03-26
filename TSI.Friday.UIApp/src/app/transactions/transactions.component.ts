import { Component, Input } from '@angular/core';

import {
  ApiService,
  ApiType,
  ModalService,
  Transaction,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { TransactionDetailsModalComponent } from './components/transaction-details-modal/transaction-details-modal.component';

@Component({
  selector: 'app-transactions',
  standalone: false,
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
  @Input()
  compact: boolean = false;

  @Input()
  entity: string | null = '';

  @Input()
  parentData: any = null;

  baseEndPoint = ApiType.Transactions;
  rowData: Transaction[] = [];

  typeMap: { [key: string]: string } = {
    Incoming: 'Entrada',
    Outgoing: 'Saída',
  };

  conditionMap: { [key: string]: string } = {
    FullPayment: 'À vista',
    InPayments: 'Parcelado',
  };

  statusMap: { [key: string]: string } = {
    Approved: 'Pago',
    Pending: 'Em Aberto',
    Delayed: 'Atrasado',
  };

  statusColorMap: { [key: string]: string } = {
    Approved: 'success',
    Pending: 'info',
    Delayed: 'danger',
    default: 'secondary',
  };

  columnDefs: ColDef[] = [];

  filteredRowData: Transaction[] = [];
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  filterStatus = { Approved: false, Pending: false, Delayed: false };
  filterType = { Incoming: false, Outgoing: false };
  showFiltersOnInit = false;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.setFiltersFromQueryParams();
    this.getTransactions(() => this.applyFilters());
    this.initializeGrid();
  }

  refreshTransactions(): void {
    this.getTransactions(() => this.applyFilters());
  }

  deleteOrder(order: Transaction): void {
    this.apiService
      .delete<WebApiResponse<Transaction>>(`${this.baseEndPoint}/remove`, order)
      .subscribe((response: WebApiResponse<Transaction>) => {
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

  onOpenModal(initialState: any) {
    const ref = this.modalService.showTemplateModal(
      TransactionDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getTransactions(() => this.applyFilters());
        ref.close();
      });
    }
  }

  applyFilters(): void {
    let filtered = [...this.rowData];
    // Filter by date range (start and end)
    if (this.filterStartDate || this.filterEndDate) {
      filtered = filtered.filter((item) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date).toISOString().slice(0, 10);
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
    // Filter by status
    const selectedStatuses = Object.entries(this.filterStatus)
      .filter(([_, checked]) => checked)
      .map(([label]) => label);
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatuses.includes(item.status ?? ''),
      );
    }
    // Filter by type
    const selectedTypes = Object.entries(this.filterType)
      .filter(([_, checked]) => checked)
      .map(([label]) => label);
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTypes.includes(item.type ?? ''),
      );
    }
    this.filteredRowData = filtered;
  }

  clearFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterStatus = { Approved: false, Pending: false, Delayed: false };
    this.filterType = { Incoming: false, Outgoing: false };
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
        minWidth: 150,
      },
      {
        field: 'description',
        headerName: 'Descrição',
        sortable: true,
        filter: true,
        maxWidth: 400,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="view" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'paymentTotalPrice',
        headerName: 'Pagamentos',
        sortable: true,
        filter: true,
        maxWidth: 150,
        cellClass: (params: ValueFormatterParams) => {
          return params.value > 0 ? 'text-success' : '';
        },
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
        field: 'expenseTotalPrice',
        headerName: 'Despesas',
        sortable: true,
        filter: true,
        maxWidth: 120,
        cellClass: (params: ValueFormatterParams) => {
          return params.value > 0 ? 'text-danger' : '';
        },
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
        field: 'condition',
        headerName: 'Condição',
        sortable: true,
        filter: true,
        maxWidth: 120,
        filterValueGetter: (params: ValueGetterParams) => {
          return this.getConditionLabel(params.data?.condition);
        },
        valueFormatter: (params: ValueFormatterParams): string => {
          return this.getConditionLabel(params.value);
        },
      },
      {
        field: 'date',
        headerName: 'Data',
        sortable: true,
        filter: true,
        maxWidth: 120,
        valueFormatter: (params: ValueFormatterParams) =>
          this.formatDateBR(params.value),
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        filter: true,
        width: 100,
        filterValueGetter: (params: ValueGetterParams) => {
          return this.getStatusLabel(params.data?.status);
        },
        cellRenderer: (params: ICellRendererParams) => {
          const status = params.value;
          const color = this.getStatusColor(status);
          const label = this.getStatusLabel(status);
          return `<span class="badge bg-${color}">${label}</span>`;
        },
      },

      {
        field: 'businessPartnerName',
        headerName: 'Cliente',
        sortable: true,
        filter: true,
        flex: 1,
        maxWidth: 300,
        hide: this.entity == 'BusinessPartner',
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? 'N/A';
          return value;
        },
      },
      {
        field: 'orderNumber',
        headerName: 'Pedido',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? 'N/A';
          return value;
        },
      },
      {
        headerName: 'Ações',
        minWidth: 150,
        sortable: false,
        filter: false,
        resizable: false,
        width: 300,
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

  private getTransactions(callback?: () => void): void {
    const endpoint =
      this.entity != ''
        ? `${this.baseEndPoint}/getBy${this.entity}Id/${this.parentData?.id}`
        : `${this.baseEndPoint}/getAll`;

    this.apiService
      .get<WebApiResponse<Transaction[]>>(endpoint)
      .subscribe((response: WebApiResponse<Transaction[]>) => {
        this.rowData = response.data ?? [];
        if (callback) callback();
      });
  }

  private getConditionLabel(condition: string): string {
    return this.conditionMap[condition] ?? condition ?? '';
  }

  private getStatusLabel(status: string): string {
    return this.statusMap[status] ?? status ?? '';
  }

  private getStatusColor(status: string): string {
    return this.statusColorMap[status] ?? this.statusColorMap['default'];
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

    // Initializes filters
    this.filterStatus = { Approved: false, Pending: false, Delayed: false };
    this.filterType = { Incoming: false, Outgoing: false };
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
    // Type filters
    if (params['type']) {
      const types = String(params['type']).split(',');
      types.forEach((t: string) => {
        if (Object.prototype.hasOwnProperty.call(this.filterType, t)) {
          (this.filterType as Record<string, boolean>)[t] = true;
        }
      });
    }
    // Date filters
    if (params['startDate']) {
      this.filterStartDate = params['startDate'];
    }
    if (params['endDate']) {
      this.filterEndDate = params['endDate'];
    }

    // Set showFiltersOnInit only on initialization
    this.showFiltersOnInit = this.hasInitialFilters();
  }

  private hasInitialFilters(): boolean {
    if (this.filterStartDate || this.filterEndDate) return true;
    if (Object.values(this.filterStatus).some((v) => v)) return true;
    if (Object.values(this.filterType).some((v) => v)) return true;
    return false;
  }
}
