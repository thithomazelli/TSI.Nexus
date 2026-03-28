import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Address,
  ApiType,
  ModalService,
  NotificationService,
  OrderProductService,
  OrderProductStatus,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';

import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { OrderProduct } from '@friday/core';
import { OrderProductsDetailsModalComponent } from './components/order-product-details-modal/order-products-details-modal.component';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-order-products',
  templateUrl: './order-products.component.html',
  styleUrl: './order-products.component.scss',
  standalone: false,
})
export class OrderProductsComponent implements OnInit, OnDestroy {
  @Input()
  compact: boolean = false;

  @Input()
  parentId?: string | null = null;

  @Input()
  isFullList: boolean = true;

  @Input()
  isFromProductsView: boolean = false;

  baseEndPoint = ApiType.OrderProducts;

  columnDefs: ColDef[] = [];
  rowData: OrderProduct[] = [];
  filteredRowData: OrderProduct[] = [];

  filterStartDate: string | null = null;
  filterEndDate: string | null = null;
  filterStatus = { InProgress: false, Delayed: false, Returned: false };
  showFiltersOnInit = false;

  private _orderProductChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private orderProductService: OrderProductService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.setFiltersFromQueryParams(params);
      this.showFiltersOnInit = this.hasInitialFilters();
      this._orderProductChangedSub =
        this.orderProductService.orderProductChanged$
          .pipe(takeUntil(this._destroy$))
          .subscribe(() => {
            this.getOrderProducts(() => this.applyFilters(), false);
          });
    });
    this.initializeGrid();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._orderProductChangedSub) {
      this._orderProductChangedSub.unsubscribe();
    }
  }

  openModal(initialState: any) {
    const initialStateWithParent = {
      ...initialState,
      parentId: initialState.data?.orderId || this.parentId,
    };

    this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialStateWithParent,
    );
  }

  deleteOrderProduct(orderProduct: OrderProduct): void {
    this.orderProductService
      .delete(orderProduct)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<OrderProduct>) => {
        this.filteredRowData = this.filteredRowData.filter(
          (p) => p.id !== orderProduct.id,
        );
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Item excluído',
          response.message,
          'success',
        );
      });
  }

  refreshOrderProducts(): void {
    this.getOrderProducts(() => this.applyFilters(), true);
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
          this.applyFilters();
          return;
        }

        this.markAsReturned(orderProduct);
      });
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

  private getOrderProducts(callback?: () => void, isRefresh = false): void {
    if (!this.parentId && !this.isFullList) {
      if (callback) callback();
      return;
    }

    const entity = this.isFromProductsView ? 'Product' : 'Order';
    let orderProducts$: Observable<WebApiResponse<OrderProduct[]>>;

    if (this.isFullList) {
      orderProducts$ = this.orderProductService.getAll();
    } else {
      orderProducts$ = this.orderProductService.getByEntityId(
        this.parentId!,
        entity,
      );
    }

    orderProducts$
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<OrderProduct[]>) => {
        this.rowData =
          response.data?.sort(
            (a, b) =>
              (b?.endDate ? new Date(b.endDate).getTime() : 0) -
              (a?.endDate ? new Date(a.endDate).getTime() : 0),
          ) ?? [];

        if (callback) {
          callback();
        }

        if (isRefresh) {
          this.notificationService.showMessage(
            ResponseStatus.Success,
            'Produtos do pedido atualizados com sucesso',
          );
        }
      });
  }

  private markAsReturned(orderProduct: OrderProduct): void {
    if (!orderProduct) {
      return;
    }

    const updatedOrderProduct: OrderProduct = {
      ...orderProduct,
      status: OrderProductStatus.Returned,
    };

    this.orderProductService
      .update(updatedOrderProduct)
      .subscribe((response: WebApiResponse<OrderProduct>) => {
        this.getOrderProducts(() => this.applyFilters(), false);
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          response.status,
        );
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
        hide: this.isFromProductsView,
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
        hide: this.isFromProductsView,
        minWidth: 180,
        cellRenderer: (params: ValueFormatterParams) => {
          const value = params.value ?? '';
          return `<a data-action="edit" class="ag-link">${value}</a>`;
        },
      },
      {
        field: 'totalPrice',
        headerName: 'Valor Total',
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
        headerName: 'Ações',
        minWidth: 150,
        sortable: false,
        filter: false,
        resizable: true,
        cellRenderer: () => {
          return `
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit" data-action="edit"></i>
          </button>
          ${
            !this.isFromProductsView
              ? `
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash" data-action="delete"></i>
          </button>
          `
              : ''
          }
        `;
        },
      },
    ];
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

  private setFiltersFromQueryParams(params: any): void {
    // Always initialize all filters
    this.filterStatus = { InProgress: false, Delayed: false, Returned: false };
    this.filterStartDate = null;
    this.filterEndDate = null;

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
    return false;
  }
}
