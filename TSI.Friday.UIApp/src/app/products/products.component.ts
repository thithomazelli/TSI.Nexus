import { Component, OnInit } from '@angular/core';
import {
  ApiService,
  ModalService,
  Product,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ValueFormatterParams,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { ProductDetailsModalComponent } from './components/product-details-modal/product-details-modal.component';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  baseEndPoint = 'products';

  rowData: Product[] = [];

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
      sortable: false,
      filter: false,
      maxWidth: 400,
      resizable: true,
      width: 280,
      cellRenderer: (params: ICellRendererParams) => {
        return `
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-folder" data-action="view"></i>
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

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.getProducts();
  }

  refreshProducts(): void {
    this.getProducts();
  }

  deleteProduct(product: Product): void {
    this.apiService
      .delete<WebApiResponse<Product>>(`${this.baseEndPoint}/remove`, product)
      .subscribe((response: WebApiResponse<Product>) => {
        this.rowData = this.rowData.filter((p) => p.id !== product.id);
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Produto excluído',
          response.message,
          'success',
        );
      });
  }

  onOpenModal(initialState: any) {
    const ref = this.modalService.showTemplateModal(
      ProductDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getProducts();
        ref.close();
      });
    }
  }

  private getProducts(): void {
    this.apiService
      .get<WebApiResponse<Product[]>>(`${this.baseEndPoint}/getAll`)
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
}
