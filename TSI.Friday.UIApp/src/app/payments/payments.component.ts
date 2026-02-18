import { Component } from '@angular/core';

import {
  ApiService,
  ApiType,
  ModalService,
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
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent {
  baseEndPoint = ApiType.Payments;
  rowData: Payment[] = [];
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
      maxWidth: 250,
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
        return params.data?.type === 'Incoming' ? 'Entrada' : 'Saída';
      },
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        let icon = '';
        let text = '';
        if (value === 'Incoming') {
          icon = '<i class="bi bi-arrow-up-circle-fill text-success me-1"></i>';
          text = 'Entrada';
        } else {
          icon =
            '<i class="bi bi-arrow-down-circle-fill text-danger me-1"></i>';
          text = 'Saída';
        }
        return icon + text;
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
        return params.data?.condition === 'FullPayment'
          ? 'À vista'
          : 'Parcelado';
      },
      valueFormatter: (params: ValueFormatterParams): string => {
        const value = params.value ?? '';
        if (value === 'FullPayment') {
          return 'À vista';
        } else {
          return 'Parcelado';
        }
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
        return params.data?.status === 'Approved'
          ? 'Pago'
          : params.data?.status === 'Pending'
            ? 'Em Aberto'
            : 'Atrasado';
        ('');
      },
      cellRenderer: (params: ICellRendererParams) => {
        const value = params.value;
        let color = 'secondary';
        // Importar OrderStatus corretamente no topo do arquivo se necessário
        let label = value;
        if (value === 'Approved') {
          color = 'success';
          label = 'Pago';
        } else if (value === 'Pending') {
          color = 'info';
          label = 'Em Aberto';
        } else if (value === 'Delayed') {
          color = 'warning';
          label = 'Atrasado';
        }
        return `<span class="badge bg-${color}">${label}</span>`;
      },
    },
    {
      field: 'clientName',
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
      headerName: '',
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
        this.rowData = this.rowData.filter((p) => p.id !== order.id);
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
}
