import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  Address,
  ApiService,
  ApiType,
  ModalService,
  OrderProductStatus,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { OrderProduct } from '@friday/core';
import { OrderProductsDetailsModalComponent } from './components/order-product-details-modal/order-products-details-modal.component';

@Component({
  selector: 'app-order-products',
  templateUrl: './order-products.component.html',
  styleUrl: './order-products.component.scss',
  standalone: false,
})
export class OrderProductsComponent {
  @Input()
  compact: boolean = false;

  @Input()
  isFullList: boolean = true;

  @Input()
  parentOrderId?: string | null = null;

  @Output()
  orderProductsUpdated = new EventEmitter<string>();

  showFilters = false;
  baseEndPoint = ApiType.OrderProducts;
  rowData: OrderProduct[] = [];
  columnDefs: ColDef[] = [];

  // Filtros customizados
  filterReturnDate: string | null = null;
  filterStatus = { Vigente: false, Atrasado: false, Devolvido: false };
  filteredRowData: OrderProduct[] = [];
  private statusMap: Record<string, string> = {
    Vigente: 'InProgress',
    Atrasado: 'Delayed',
    Devolvido: 'Returned',
  };

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.getOrderProducts();
    this.initializeGrid();
    this.filteredRowData = [...this.rowData];
  }

  applyFilters(): void {
    this.filterOrderProducts();
  }

  clearFilters(): void {
    this.filterReturnDate = null;
    this.filterStatus = { Vigente: false, Atrasado: false, Devolvido: false };
    this.filteredRowData = [...this.rowData];
  }

  refreshOrderProducts(): void {
    this.getOrderProducts();
  }

  updateOrderProductStatus(orderProduct: OrderProduct): void {
    if (!orderProduct || orderProduct.status === 'Returned') {
      return;
    }

    this.modalService
      .showSweetConfirmation(
        '',
        'Tem certeza que deseja marcar este item como devolvido?',
      )
      .then((result: any) => {
        if (!result.isConfirmed) {
          return;
        }

        this.markAsReturned(orderProduct);
      });
  }

  deleteOrderProduct(orderProduct: OrderProduct): void {
    this.apiService
      .delete<
        WebApiResponse<OrderProduct>
      >(`${this.baseEndPoint}/remove`, orderProduct)
      .subscribe((response: WebApiResponse<OrderProduct>) => {
        this.rowData = this.rowData.filter((p) => p.id !== orderProduct.id);
        this.orderProductsUpdated.emit(this.parentOrderId ?? '');
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          'success',
        );
      });
  }

  onOpenModal(initialState: any) {
    const initialStateWithParent = {
      ...initialState,
      parentId: this.parentOrderId,
    };

    const ref = this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialStateWithParent,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getOrderProducts();
        this.orderProductsUpdated.emit(this.parentOrderId ?? '');
        ref.close();
      });
    }
  }

  private getOrderProducts(): void {
    if (!this.parentOrderId && !this.isFullList) {
      return;
    }

    const endPointUrl = this.isFullList
      ? `${this.baseEndPoint}/getAll`
      : `${this.baseEndPoint}/getByOrderId/${this.parentOrderId}`;

    this.apiService
      .get<WebApiResponse<OrderProduct[]>>(endPointUrl)
      .subscribe((response: WebApiResponse<OrderProduct[]>) => {
        this.rowData =
          response.data?.sort(
            (a, b) =>
              (b?.endDate ? new Date(b.endDate).getTime() : 0) -
              (a?.endDate ? new Date(a.endDate).getTime() : 0),
          ) ?? [];
        this.filteredRowData = [...this.rowData];
      });
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
        field: 'status',
        headerName: 'Devolvido?',
        sortable: true,
        filter: true,
        maxWidth: 140,
        cellRenderer: (params: any) => {
          const isReturned = params.value === OrderProductStatus.Returned;
          return `<input type="checkbox" ${
            isReturned ? 'checked disabled' : ''
          } data-action="update" />`;
        },
      },
      {
        field: 'productSku',
        headerName: 'SKU',
        sortable: true,
        filter: true,
        maxWidth: 100,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="edit" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'productName',
        headerName: 'Produto',
        sortable: true,
        filter: true,
        minWidth: 180,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="edit" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'totalPrice',
        headerName: 'Total',
        sortable: true,
        filter: true,
        maxWidth: 120,
        valueFormatter: (params: ValueFormatterParams) =>
          params.value ? `R$ ${params.value.toFixed(2)}` : 'R$ 0,00',
      },
      {
        field: 'endDate',
        headerName: 'Data de Retorno',
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
        minWidth: 100,
        cellRenderer: (params: ICellRendererParams) => {
          const value = params.value;
          let color = 'secondary';
          // Importar OrderStatus corretamente no topo do arquivo se necessário
          let label = value;
          if (value === 'InProgress') {
            color = 'info';
            label = 'Vigente';
          } else if (value === 'Delayed') {
            color = 'danger';
            label = 'Atrasado';
          } else if (value === 'Returned') {
            color = 'success';
            label = 'Devolvido';
          }
          return `<span class="badge bg-${color}">${label}</span>`;
        },
      },
      {
        field: 'orderNumber',
        headerName: 'Pedido',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        hide: !this.isFullList,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? 'N/A';
          return value;
        },
      },
      {
        field: 'businessPartnerName',
        headerName: 'Cliente',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 220,
        hide: !this.isFullList,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? 'N/A';
          return value;
        },
      },
      {
        field: 'address',
        headerName: 'Endereço',
        sortable: true,
        filter: true,
        minWidth: 350,
        valueFormatter: (params: ValueFormatterParams) => {
          const addressModel = new Address({ ...params.value });
          return params.value != null
            ? `${addressModel.street}, ${addressModel.number} - ${addressModel.city}/${addressModel.state}`
            : 'N/A';
        },
      },
      {
        headerName: '',
        sortable: false,
        filter: false,
        resizable: true,
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

  private markAsReturned(orderProduct: OrderProduct): void {
    if (!orderProduct) {
      return;
    }

    const updatedOrderProduct = { ...orderProduct, status: 'Returned' };
    this.apiService
      .put<
        WebApiResponse<OrderProduct>
      >(`${this.baseEndPoint}/update`, updatedOrderProduct)
      .subscribe((response: WebApiResponse<OrderProduct>) => {
        this.getOrderProducts();
        this.orderProductsUpdated.emit(this.parentOrderId ?? '');
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

  // Métodos de filtro
  private filterOrderProducts(): void {
    let filtered = [...this.rowData];
    // Filtro por data de retorno
    if (this.filterReturnDate) {
      filtered = filtered.filter((item) => {
        if (!item.endDate) return false;
        const itemDate = new Date(item.endDate).toISOString().slice(0, 10);
        const filterDate = new Date(this.filterReturnDate as string)
          .toISOString()
          .slice(0, 10);
        return itemDate === filterDate;
      });
    }
    // Filtro por status
    const selectedStatus = Object.entries(this.filterStatus)
      .filter(([_, checked]) => checked)
      .map(([label]) => this.statusMap[label]);
    if (selectedStatus.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatus.includes(item.status),
      );
    }
    this.filteredRowData = filtered;
  }
}
