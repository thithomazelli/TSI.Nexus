import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ApiService,
  ApiType,
  BusinessPartner,
  ModalService,
  Order,
  Transaction,
  Payment,
  WebApiResponse,
  PaymentStatus,
  PaymentService,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { PaymentDetailsModalComponent } from './components/payment-details-modal/payment-details-modal.component';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
  standalone: false,
})
export class PaymentsComponent {
  @Input()
  entity: string = '';

  @Input()
  data?: BusinessPartner | Order | Transaction | null = null;

  @Input()
  compact: boolean = false;

  @Input()
  canAdd: boolean = false;

  @Output()
  refreshParent = new EventEmitter<void>();

  baseEndPoint = ApiType.Payment;

  rowData: Payment[] = [];

  typeMap: { [key: string]: string } = {
    Incoming: 'Entrada',
    Outgoing: 'Saída',
  };

  typeIconMap: { [key: string]: string } = {
    Incoming: '<i class="bi bi-arrow-up-circle-fill text-success me-1"></i>',
    Outgoing: '<i class="bi bi-arrow-down-circle-fill text-danger me-1"></i>',
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

  filteredRowData: Payment[] = [];
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  filterStatus = { Approved: false, Pending: false, Delayed: false };
  filterType = { Incoming: false, Outgoing: false };
  showFiltersOnInit = false;

  constructor(
    private apiService: ApiService,
    private paymentService: PaymentService,
    private modalService: ModalService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initializeColumnDefs();
    this.route.queryParams.subscribe((params) => {
      this.setFiltersFromQueryParams(params);
      this.showFiltersOnInit = this.hasInitialFilters();
      this.getPayment(() => this.applyFilters());
    });
  }

  refreshOrders(): void {
    this.getPayment(() => this.applyFilters());
  }

  updatePaymentStatus(payment: Payment): void {
    if (!payment || payment.status === 'Approved') {
      return;
    }

    this.modalService
      .showSweetConfirmation(
        '',
        'Tem certeza que deseja marcar este item como pago?',
      )
      .then((result: any) => {
        if (!result.isConfirmed) {
          this.applyFilters();
          return;
        }

        this.markAsApproved(payment);
      });
  }

  deleteOrder(paymentInstallment: Payment): void {
    this.apiService
      .delete<
        WebApiResponse<Payment>
      >(`${this.baseEndPoint}/remove`, paymentInstallment)
      .subscribe((response: WebApiResponse<Payment>) => {
        this.rowData = this.rowData.filter(
          (p) => p.id !== paymentInstallment.id,
        );
        this.refreshParent.emit();
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          response.status,
        );
      });
  }

  onOpenModal(initialState: any) {
    const initialStateWithParent = {
      ...initialState,
      parentId: this.data?.id,
      parentData: this.data,
    };

    const ref = this.modalService.showTemplateModal(
      PaymentDetailsModalComponent,
      initialStateWithParent,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.refreshParent.emit();
        this.getPayment(() => this.applyFilters());
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

  private initializeColumnDefs(): void {
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
        field: 'status',
        headerName: 'Pago?',
        sortable: true,
        filter: true,
        maxWidth: 100,
        cellRenderer: (params: any) => {
          const isApproved = params.value === PaymentStatus.Approved;
          return `<input type="checkbox" ${
            isApproved ? 'checked disabled' : ''
          } data-action="update" />`;
        },
      },
      {
        field: 'description',
        headerName: 'Descrição',
        hide: this.compact,
        sortable: true,
        filter: true,
        flex: 2,
        maxWidth: 450,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="edit" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'installmentNumber',
        headerName: '#',
        sortable: true,
        filter: true,
        flex: 2,
        maxWidth: 100,
        hide: !this.compact,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="edit" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'type',
        headerName: 'Tipo',
        sortable: true,
        filter: true,
        maxWidth: 120,
        resizable: true,
        filterValueGetter: (params: ValueGetterParams) => {
          return this.getTypeLabel(params.data?.type);
        },
        cellRenderer: (params: ValueFormatterParams) => {
          const type = params.value ?? '';
          return this.getTypeIcon(type) + this.getTypeLabel(type);
        },
      },
      {
        field: 'price',
        headerName: 'Valor',
        sortable: true,
        filter: true,
        maxWidth: 120,
        cellClass: (params: ValueFormatterParams) => {
          const type = params.data?.type;
          if (type === 'Incoming') {
            return 'text-success'; // verde escuro
          } else if (type === 'Outgoing') {
            return 'text-danger'; // vermelho
          }
          return '';
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
        field: 'status',
        headerName: 'Status',
        sortable: true,
        filter: true,
        flex: 2,
        maxWidth: 100,
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
        field: 'date',
        headerName: 'Data',
        sortable: true,
        filter: true,
        flex: 2,
        maxWidth: 120,
        valueFormatter: (params: ValueFormatterParams) =>
          this.formatDateBR(params.value),
      },
      {
        field: 'businessPartnerName',
        headerName: 'Cliente',
        sortable: true,
        filter: true,
        flex: 1,
        maxWidth: 150,
        hide: this.entity === 'BusinessPartner',
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
        maxWidth: 150,
        hide: this.entity === 'Order',
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? 'N/A';
          return value;
        },
      },
      {
        headerName: 'Ações',
        sortable: false,
        filter: false,
        resizable: false,
        maxWidth: 150,
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

  private getPayment(callback?: () => void): void {
    const endpoint =
      this.entity != ''
        ? `${this.baseEndPoint}/getBy${this.entity}Id/${this.data?.id}`
        : `${this.baseEndPoint}/getAll`;

    this.apiService
      .get<WebApiResponse<Payment[]>>(endpoint)
      .subscribe((response: WebApiResponse<Payment[]>) => {
        this.rowData = response.data ?? [];
        if (callback) callback();
      });
  }

  private getTypeLabel(type: string): string {
    return this.typeMap[type] ?? type ?? '';
  }

  private getTypeIcon(type: string): string {
    return this.typeIconMap[type] ?? '';
  }

  private getStatusLabel(status: string): string {
    return this.statusMap[status] ?? status ?? '';
  }

  private getStatusColor(status: string): string {
    return this.statusColorMap[status] ?? this.statusColorMap['default'];
  }

  private setFiltersFromQueryParams(params: any): void {
    // Always initialize all filters
    this.filterStatus = { Approved: false, Pending: false, Delayed: false };
    this.filterType = { Incoming: false, Outgoing: false };

    // Status filters
    if (params['status']) {
      const statuses = Array.isArray(params['status'])
        ? params['status']
        : String(params['status']).split(',');
      statuses.forEach((s: string) => {
        if (Object.prototype.hasOwnProperty.call(this.filterStatus, s)) {
          (this.filterStatus as Record<string, boolean>)[s] = true;
        }
      });
    }

    // Type filters
    if (params['type']) {
      const types = Array.isArray(params['type'])
        ? params['type']
        : String(params['type']).split(',');
      types.forEach((t: string) => {
        if (Object.prototype.hasOwnProperty.call(this.filterType, t)) {
          (this.filterType as Record<string, boolean>)[t] = true;
        }
      });
    }

    // Date filters
    this.filterStartDate = params['startDate'] || null;
    this.filterEndDate = params['endDate'] || null;
  }

  private hasInitialFilters(): boolean {
    // Checks if any filter is active
    if (this.filterStartDate || this.filterEndDate) {
      return true;
    }
    if (Object.values(this.filterStatus).some((v) => v)) {
      return true;
    }
    if (Object.values(this.filterType).some((v) => v)) {
      return true;
    }
    return false;
  }

  private markAsApproved(payment: Payment): void {
    if (!payment) {
      return;
    }

    const updatedPayment = { ...payment, status: 'Approved' };
    this.apiService
      .put<
        WebApiResponse<Payment>
      >(`${this.baseEndPoint}/update`, updatedPayment)
      .subscribe((response: WebApiResponse<Payment>) => {
        this.getPayment(() => this.applyFilters());
        this.refreshParent.emit();
        this.paymentService.markPaymentAsChanged();
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          response.status,
        );
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
}
