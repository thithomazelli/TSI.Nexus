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
import { BehaviorSubject } from 'rxjs';
import { ProductDetailsComponent } from './product-details/product-details.component';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private _baseEndPoint = 'product';

  rowData: Product[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      minWidth: 80,
      hide: true,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      sortable: true,
      filter: true,
      width: 90,
      resizable: false,
    },
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 300,
    },
    {
      field: 'price',
      headerName: 'Price',
      sortable: true,
      filter: true,
      maxWidth: 120,
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
      field: 'actions',
      headerName: 'Actions',
      cellRenderer: (params: ICellRendererParams) => {
        return `
          <button class="btn btn-outline-primary btn-sm" data-action="edit">Edit</button>
          <button class="btn btn-outline-danger btn-sm ms-2" data-action="delete">Delete</button>
        `;
      },
      sortable: false,
      filter: false,
      maxWidth: 150,
      resizable: false,
    },
  ];

  modalDetails = ProductDetailsComponent;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.getProducts();
  }

  refreshProducts(): void {
    this.getProducts();
  }

  deleteProduct(product: Product): void {
    this.apiService
      .delete<WebApiResponse<Product>>(`${this._baseEndPoint}/remove`, product)
      .subscribe((response: WebApiResponse<Product>) => {
        this.rowData = this.rowData.filter((p) => p.id !== product.id);

        this.modalService.hideModal();
        this.modalService.showNotification(
          true,
          'Produto excluído',
          response.message
        );
      });
  }

  private getProducts(): void {
    this.apiService
      .get<WebApiResponse<Product[]>>(`${this._baseEndPoint}/getAll`)
      .subscribe((response: WebApiResponse<Product[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
