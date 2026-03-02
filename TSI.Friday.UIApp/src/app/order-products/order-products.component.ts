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

  baseEndPoint = ApiType.OrderProducts;

  rowData: OrderProduct[] = [];
  columnDefs: ColDef[] = [];

  filteredRowData: OrderProduct[] = [];
  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  filterStatus = { InProgress: false, Delayed: false, Returned: false };

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.getOrderProducts();
    this.initializeGrid();
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

  applyFilters(): void {
    let filtered = [...this.rowData];
    // Filter by date range (start and end)
    if (this.filterStartDate || this.filterEndDate) {
      filtered = filtered.filter((item) => {
        if (!item.endDate) return false;
        const itemDate = new Date(item.endDate).toISOString().slice(0, 10);
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
        selectedStatuses.includes(item.status),
      );
    }
    this.filteredRowData = filtered;
  }

  clearFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterStatus = { InProgress: false, Delayed: false, Returned: false };
    this.filteredRowData = [...this.rowData];
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
        // Atualiza também os dados filtrados ao buscar novos dados
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
}
