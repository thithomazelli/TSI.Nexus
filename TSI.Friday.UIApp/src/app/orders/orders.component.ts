import { Component } from '@angular/core';
import {
  ApiService,
  ApiType,
  ModalService,
  Order,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  baseEndPoint = ApiType.Orders;
  rowData: Order[] = [];
  columnDefs: ColDef[] = [
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
      headerName: 'Order Number',
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
      field: 'clientName',
      headerName: 'Client Name',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      sortable: true,
      filter: true,
      flex: 2,
      width: 200,
    },
    {
      field: 'totalPrice',
      headerName: 'Total Price',
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
        } else if (value === 'WaitingPayment' || value === 'Waiting payment') {
          color = 'warning';
          label = 'Aguardando Pagamento';
        }
        return `<span class="badge bg-${color}">${label}</span>`;
      },
    },
    {
      headerName: '',
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
          <button class="btn btn-secondary btn-sm text-white" data-action="edit">
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
    this.getOrders();
  }

  refreshOrders(): void {
    this.getOrders();
  }

  deleteOrder(order: Order): void {
    this.apiService
      .delete<WebApiResponse<Order>>(`${this.baseEndPoint}/remove`, order)
      .subscribe((response: WebApiResponse<Order>) => {
        this.rowData = this.rowData.filter((p) => p.id !== order.id);
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Ordem excluída',
          response.message,
          'success',
        );
      });
  }

  onOpenModal(initialState: any) {
    const ref = this.modalService.showTemplateModal(
      OrderDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getOrders();
        ref.close();
      });
    }
  }

  private getOrders(): void {
    this.apiService
      .get<WebApiResponse<Order[]>>(`${this.baseEndPoint}/getAll`)
      .subscribe((response: WebApiResponse<Order[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
