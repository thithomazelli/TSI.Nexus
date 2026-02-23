import { Component } from '@angular/core';

import {
  ApiService,
  ApiType,
  ModalService,
  Payment,
  ResponseStatus,
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
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  baseEndPoint = ApiType.Payments;
  rowData: Payment[] = [];

  typeMap: { [key: string]: string } = {
    Incoming: 'Entrada',
    Outgoing: 'Saída',
  };

  typeIconMap: { [key: string]: string } = {
    Incoming: '<i class="bi bi-arrow-up-circle-fill text-success me-1"></i>',
    Outgoing: '<i class="bi bi-arrow-down-circle-fill text-danger me-1"></i>',
  };

  conditionMap: { [key: string]: string } = {
    FullPayment: 'À vista',
    InInstallments: 'Parcelado',
  };

  statusMap: { [key: string]: string } = {
    Approved: 'Pago',
    Pending: 'Em Aberto',
    Delayed: 'Atrasado',
  };

  statusColorMap: { [key: string]: string } = {
    Approved: 'success',
    Pending: 'info',
    Delayed: 'warning',
    default: 'secondary',
  };

  columnDefs: ColDef[] = [
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
      headerName: 'Description',
      sortable: true,
      filter: true,
      flex: 2,
      maxWidth: 400,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        return `<a data-action="view" class="ag-link">${value}</a>`;
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
      field: 'condition',
      headerName: 'Condição',
      sortable: true,
      filter: true,
      flex: 2,
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
      flex: 2,
      maxWidth: 120,
      valueFormatter: (params: ValueFormatterParams) =>
        this.formatDateBR(params.value),
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
      field: 'businessPartnerName',
      headerName: 'Cliente',
      sortable: true,
      filter: true,
      flex: 1,
      maxWidth: 300,
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

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.getPayments();
  }

  refreshOrders(): void {
    this.getPayments();
  }

  deleteOrder(order: Payment): void {
    this.apiService
      .delete<WebApiResponse<Payment>>(`${this.baseEndPoint}/remove`, order)
      .subscribe((response: WebApiResponse<Payment>) => {
        if (response.status === ResponseStatus.Success) {
          this.rowData = this.rowData.filter((p) => p.id !== order.id);
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
      PaymentDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getPayments();
        ref.close();
      });
    }
  }

  private getPayments(): void {
    this.apiService
      .get<WebApiResponse<Payment[]>>(`${this.baseEndPoint}/getAll`)
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
}
