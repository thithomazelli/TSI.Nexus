import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  Address,
  ApiService,
  ApiType,
  ModalService,
  WebApiResponse,
} from '@friday/core';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { OrderProduct } from '@friday/core';
import { OrderProductsDetailsModalComponent } from './components/order-product-details-modal/order-products-details-modal.component';

@Component({
  selector: 'app-order-products',
  standalone: false,
  templateUrl: './order-products.component.html',
  styleUrl: './order-products.component.scss',
})
export class OrderProductsComponent {
  @Input()
  parentOrderId?: number | null = null;

  @Output()
  orderProductsUpdated = new EventEmitter<number>();

  baseEndPoint = ApiType.OrderProducts;

  rowData: OrderProduct[] = [];
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, hide: true },
    {
      field: 'productSku',
      headerName: 'SKU',
      sortable: true,
      filter: true,
      width: 120,
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
      width: 300,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        return `<a data-action="edit" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'description',
      headerName: 'Descrição',
      sortable: true,
      filter: true,
      hide: true,
    },
    {
      field: 'quantity',
      headerName: 'Qtd',
      sortable: true,
      filter: true,
      width: 120,
      hide: true,
    },
    {
      field: 'price',
      headerName: 'Preço Unitário',
      sortable: true,
      filter: true,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? `R$ ${params.value.toFixed(2)}` : '',
    },
    {
      field: 'discount',
      headerName: 'Desconto',
      sortable: true,
      filter: true,
      width: 120,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? `${params.value}%` : '0%',
    },
    {
      field: 'totalPrice',
      headerName: 'Total',
      sortable: true,
      filter: true,
      width: 120,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? `R$ ${params.value.toFixed(2)}` : 'R$ 0,00',
    },
    {
      field: 'address',
      headerName: 'Endereço',
      sortable: true,
      filter: true,
      width: 430,
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
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash"></i> Excluir
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
    this.getOrderProducts();
  }

  refreshOrderProducts(): void {
    this.getOrderProducts();
  }

  deleteOrderProduct(orderProduct: OrderProduct): void {
    this.apiService
      .delete<
        WebApiResponse<OrderProduct>
      >(`${this.baseEndPoint}/remove`, orderProduct)
      .subscribe((response: WebApiResponse<OrderProduct>) => {
        this.rowData = this.rowData.filter((p) => p.id !== orderProduct.id);
        this.orderProductsUpdated.emit(this.parentOrderId ?? 0);
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
      parentData: { orderProducts: this.rowData },
    };

    const ref = this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialStateWithParent,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getOrderProducts();
        this.orderProductsUpdated.emit(this.parentOrderId ?? 0);
        ref.close();
      });
    }
  }

  private getOrderProducts(): void {
    if (!this.parentOrderId) return;
    this.apiService
      .get<
        WebApiResponse<OrderProduct[]>
      >(`${this.baseEndPoint}/getByOrderId/${this.parentOrderId}`)
      .subscribe((response: WebApiResponse<OrderProduct[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
