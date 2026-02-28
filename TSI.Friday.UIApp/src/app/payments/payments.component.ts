import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  ApiService,
  ApiType,
  BusinessPartner,
  ModalService,
  Order,
  Transaction,
  Payment,
  WebApiResponse,
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

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.initializeColumnDefs();
    this.getPayment();
  }

  refreshOrders(): void {
    this.getPayment();
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
        this.getPayment();
        ref.close();
      });
    }
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
        headerName: '',
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

  private getPayment(): void {
    const endpoint =
      this.entity != ''
        ? `${this.baseEndPoint}/getBy${this.entity}Id/${this.data?.id}`
        : `${this.baseEndPoint}/getAll`;

    this.apiService
      .get<WebApiResponse<Payment[]>>(endpoint)
      .subscribe((response: WebApiResponse<Payment[]>) => {
        this.rowData = response.data ?? [];
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
