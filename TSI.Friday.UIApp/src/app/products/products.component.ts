import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ModalService,
  NotificationService,
  Product,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import { ProductService } from '../core/services/product/product.service';
import { Subscription, tap, Subject, takeUntil } from 'rxjs';
import {
  ColDef,
  ValueFormatterParams,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { ProductDetailsModalComponent } from './components/product-details-modal/product-details-modal.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  standalone: false,
})
export class ProductsComponent implements OnInit, OnDestroy {
  private _productChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  baseEndPoint = 'products';

  categoryMap: { [key: string]: string } = {
    Electric: 'Elétrica',
    Hydraulics: 'Hidráulica',
    Structure: 'Estrutura',
    Drywall: 'Drywall',
    Painting: 'Pintura',
    Finishing: 'Acabamento',
    Sanitary: 'Sanitário',
    Equipment: 'Equipamento',
    Fixing: 'Fixação',
    Finish: 'Acabamento',
  };

  unitMap: { [key: string]: string } = {
    Unit: 'Unidade',
    Kilogram: 'Quilograma',
    Gram: 'Grama',
  };

  typeMap: { [key: string]: string } = {
    Sale: 'Venda',
    Rental: 'Aluguel',
    Service: 'Serviço',
  };

  rowData: Product[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      hide: true,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      sortable: true,
      filter: true,
      width: 90,
      resizable: true,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'name',
      headerName: 'Nome',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 250,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'quantityInStock',
      headerName: 'Status',
      sortable: true,
      filter: true,
      maxWidth: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const value = params.value;
        const type = params.data?.type;
        let color = 'secondary';
        let label = value;

        if (type === 'Service') {
          color = 'success';
          label = 'Disponível';
        } else if (value === 0) {
          color = 'danger';
          label = 'Indisponível';
        } else {
          color = 'success';
          label = 'Disponível';
        }
        return `<span class="badge bg-${color}">${label}</span>`;
      },
    },
    {
      field: 'quantityInStock',
      headerName: 'Estoque',
      sortable: true,
      filter: true,
      maxWidth: 120,
    },
    {
      field: 'price',
      headerName: 'Preço',
      sortable: true,
      filter: true,
      maxWidth: 120,
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
      field: 'category',
      headerName: 'Categoria',
      sortable: true,
      filter: true,
      maxWidth: 120,
      filterValueGetter: (params: ValueGetterParams) => {
        return (
          this.categoryMap[params.data?.category] ?? params.data?.category ?? ''
        );
      },
      valueFormatter: (params: ValueFormatterParams) => {
        return this.getCategoryLabel(params.value);
      },
    },
    {
      field: 'unit',
      headerName: 'Unidade',
      sortable: true,
      filter: true,
      maxWidth: 120,
      filterValueGetter: (params: ValueGetterParams) => {
        return this.getUnitLabel(params.data?.unit);
      },
      cellRenderer: (params: ICellRendererParams) => {
        return this.getUnitLabel(params.data?.unit);
      },
    },
    {
      field: 'type',
      headerName: 'Tipo',
      sortable: true,
      filter: true,
      maxWidth: 120,
      filterValueGetter: (params: ValueGetterParams) => {
        return this.getTypeLabel(params.data?.type);
      },
      cellRenderer: (params: ICellRendererParams) => {
        return this.getTypeLabel(params.data?.type);
      },
    },
    {
      headerName: 'Ações',
      flex: 1,
      minWidth: 150,
      sortable: false,
      filter: false,
      resizable: true,
      cellRenderer: (params: ICellRendererParams) => {
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
    private modalService: ModalService,
    private notificationService: NotificationService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this._productChangedSub = this.productService.productChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.getProducts();
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._productChangedSub) {
      this._productChangedSub.unsubscribe();
    }
  }

  openModal(initialState: any) {
    this.modalService.showTemplateModal(
      ProductDetailsModalComponent,
      initialState,
    );
  }

  deleteProduct(product: Product): void {
    this.productService
      .delete(product)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Product>) => {
        if (response.status === ResponseStatus.Success) {
          this.rowData = this.rowData.filter((p) => p.id !== product.id);
        }
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          response.status,
        );
      });
  }

  refreshProducts(): void {
    this.productService
      .refresh()
      .pipe(
        tap({
          next: () =>
            this.notificationService.showMessage(
              ResponseStatus.Success,
              'Produtos atualizados com sucesso',
            ),
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao atualizar produtos',
            ),
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<Product[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private getProducts(): void {
    this.productService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Product[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private getUnitLabel(unit: string): string {
    return this.unitMap[unit] ?? unit ?? '';
  }

  private getTypeLabel(type: string): string {
    return this.typeMap[type] ?? type ?? '';
  }

  private getCategoryLabel(category: string): string {
    return this.categoryMap[category] ?? category ?? '';
  }
}
