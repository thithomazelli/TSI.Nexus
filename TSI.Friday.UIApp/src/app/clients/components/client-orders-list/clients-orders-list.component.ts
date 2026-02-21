import { Component, Input } from '@angular/core';
import {
  ApiService,
  ApiType,
  ModalService,
  WebApiResponse,
  BusinessPartner,
  Order,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { OrderDetailsModalComponent } from '../../../orders/components/order-details-modal/order-details-modal.component';

@Component({
  selector: 'app-client-orders-list',
  standalone: false,
  templateUrl: './clients-orders-list.component.html',
  styleUrl: './clients-orders-list.component.scss',
})
export class ClientsOrdersListComponent {
  @Input()
  parentData?: BusinessPartner | null = null;

  private _baseEndPoint = ApiType.Orders;

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
      cellRenderer: (params: ICellRendererParams) => {
        return `
            <button class="btn btn-info btn-sm" data-action="view">
              <i class="fas fa-edit"></i>
              Edit
            </button>
            <button class="btn btn-danger btn-sm" data-action="delete">
              <i class="fas fa-trash"></i>  
              Delete
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
      .delete<WebApiResponse<Order>>(`${this._baseEndPoint}/remove`, order)
      .subscribe((response: WebApiResponse<Order>) => {
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
    const initialStateWithClient = {
      ...initialState,
      data: <Order>{
        businessPartnerId: this.parentData?.id,
        businessPartnerName: this.parentData?.name,
        orderProducts: [],
      },
    };

    const ref = this.modalService.showTemplateModal(
      OrderDetailsModalComponent,
      initialStateWithClient,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.refreshOrders();
        ref.close();
      });
    }
  }

  private getOrders(): void {
    this.apiService
      .get<
        WebApiResponse<Order[]>
      >(`${this._baseEndPoint}/getByBusinessPartnerId/${this.parentData?.id}`)
      .subscribe((response: WebApiResponse<Order[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
