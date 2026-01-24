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
      // width: 90,
      resizable: false,
      // minWidth: 150,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      flex: 1,
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
      // minWidth: 1500,
      hide: true,
    },
    {
      field: 'price',
      headerName: 'Price',
      sortable: true,
      filter: true,
      // maxWidth: 120,
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
      field: 'unit',
      headerName: 'Unit',
      sortable: true,
      filter: true,
      maxWidth: 120,
    },
    {
      field: 'quantityInStock',
      headerName: 'Quantity',
      sortable: true,
      filter: true,
      maxWidth: 120,
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
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-folder"></i>
            View
          </button>
          <button class="btn btn-info btn-sm" data-action="edit">
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
}
