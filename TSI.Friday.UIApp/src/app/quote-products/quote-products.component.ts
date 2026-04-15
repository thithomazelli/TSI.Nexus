import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ApiType,
  ModalService,
  NotificationService,
  QuoteProductService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';

import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { QuoteProduct } from '@friday/core';
import { QuoteProductDetailsModalComponent } from './components/quote-product-details-modal/quote-product-details-modal.component';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-quote-products',
  templateUrl: './quote-products.component.html',
  styleUrl: './quote-products.component.scss',
  standalone: false,
})
export class QuoteProductsComponent implements OnInit, OnDestroy {
  @Input()
  compact: boolean = false;

  @Input()
  parentId?: string | null = null;

  @Input()
  isFullList: boolean = true;

  @Input()
  isFromProductsView: boolean = false;

  baseEndPoint = ApiType.QuoteProducts;

  columnDefs: ColDef[] = [];
  rowData: QuoteProduct[] = [];
  filteredRowData: QuoteProduct[] = [];

  private _quoteProductChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private quoteProductService: QuoteProductService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this._quoteProductChangedSub = this.quoteProductService.quoteProductChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.getQuoteProducts();
      });
    this.initializeGrid();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._quoteProductChangedSub) {
      this._quoteProductChangedSub.unsubscribe();
    }
  }

  openModal(initialState: any) {
    const initialStateWithParent = {
      ...initialState,
      parentId: initialState.data?.orderId || this.parentId,
    };

    this.modalService.showTemplateModal(
      QuoteProductDetailsModalComponent,
      initialStateWithParent,
    );
  }

  deleteQuoteProduct(quoteProduct: QuoteProduct): void {
    this.quoteProductService
      .delete(quoteProduct)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<QuoteProduct>) => {
        this.filteredRowData = this.filteredRowData.filter(
          (p) => p.id !== quoteProduct.id,
        );
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Item excluído',
          response.message,
          'success',
        );
      });
  }

  refreshQuoteProducts(): void {
    this.getQuoteProducts(true);
  }

  private getQuoteProducts(isRefresh = false): void {
    if (!this.parentId && !this.isFullList) {
      return;
    }

    const entity = this.isFromProductsView ? 'Product' : 'Order';
    let quoteProducts$: Observable<WebApiResponse<QuoteProduct[]>>;

    if (this.isFullList) {
      quoteProducts$ = this.quoteProductService.getAll();
    } else {
      quoteProducts$ = this.quoteProductService.getByEntityId(
        this.parentId!,
        entity,
      );
    }

    quoteProducts$
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<QuoteProduct[]>) => {
        this.rowData = response.data ?? [];
        this.filteredRowData = [...this.rowData];

        if (isRefresh) {
          this.notificationService.showMessage(
            ResponseStatus.Success,
            'Produtos do orçamento atualizados com sucesso',
          );
        }
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
        field: 'quantity',
        headerName: 'Quantidade',
        sortable: true,
        filter: true,
        maxWidth: 120,
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
        field: 'orderNumber',
        headerName: 'Orçamento',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        hide: !this.isFullList,
      },
      {
        field: 'businessPartnerName',
        headerName: 'Cliente',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 220,
        hide: !this.isFullList,
      },
      {
        headerName: 'Ações',
        flex: 1,
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
}
