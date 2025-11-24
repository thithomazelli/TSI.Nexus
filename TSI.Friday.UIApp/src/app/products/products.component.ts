import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Product, WebApiResponse } from '@friday/core';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { AG_GRID_LOCALE_BR } from '@ag-grid-community/locale';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  @ViewChild('modalTemplate')
  modalTemplate!: TemplateRef<any>; // Reference to the modal template

  private _baseEndPoint = 'product'; // Base endpoint for products

  localeText = AG_GRID_LOCALE_BR;
  rowData: Product[] = [<Product>{ sku: '123', name: 'Default Product' }]; // Data for the grid
  gridApi!: GridApi; // Reference to the grid API
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', sortable: true, filter: true },
    { field: 'sku', headerName: 'SKU', sortable: true, filter: true },
    { field: 'name', headerName: 'Name', sortable: true, filter: true },
    {
      field: 'description',
      headerName: 'Description',
      sortable: true,
      filter: true,
    },
    { field: 'price', headerName: 'Price', sortable: true, filter: true },
    { field: 'unit', headerName: 'Unit', sortable: true, filter: true },
    {
      field: 'quantityInStock',
      headerName: 'Quantity',
      sortable: true,
      filter: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        return `
          <button class="btn btn-warning btn-sm" data-action="edit">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
        `;
      },
      cellRendererParams: {
        onClick: this.onActionClicked.bind(this),
      },
    },
  ];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  noRowsOverlayTemplate =
    '<span style="padding: 10px; border: 2px solid #ccc;">No data to display.</span>';

  products$ = new BehaviorSubject<Product[] | null>(null); // Cache for products
  productForm!: FormGroup; // Form for add/edit product
  isEditMode = false; // Flag to determine if it's add or edit
  currentProductId: number | null = null; // Holds the ID of the product being edited
  modalRef?: BsModalRef; // Reference to the modal

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    // this.getProducts();
    this.initForm();
  }

  // Fetch all products and set row data
  getProducts(): void {
    this.apiService
      .get<WebApiResponse<Product[]>>(`${this._baseEndPoint}/getAll`)
      .subscribe((response: WebApiResponse<Product[]>) => {
        this.rowData = [<Product>{ sku: '123', name: 'Default Product' }]; // Ensure rowData is an empty array if no data is returned
      });
  }

  // Refresh the product list
  refreshProducts(): void {
    this.getProducts();
  }

  // Handle grid ready event
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  // Handle filter input
  onFilterTextBoxChanged(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.gridApi.setGridOption('quickFilterText', filterValue);
  }

  // Handle action buttons (edit/delete)
  onActionClicked(event: any): void {
    const action = event.event.target.getAttribute('data-action');
    const product = event.data;

    if (action === 'edit') {
      this.openEditModal(this.modalTemplate, product); // Pass the template reference
    } else if (action === 'delete') {
      this.deleteProduct(product.id);
    }
  }

  // Open the modal for adding a product
  openAddModal(template: any): void {
    this.isEditMode = false;
    this.currentProductId = null;
    this.productForm.reset(); // Clear the form
    this.modalRef = this.modalService.show(template); // Open the modal
  }

  // Open the modal for editing a product
  openEditModal(template: any, product: Product): void {
    this.isEditMode = true;
    this.currentProductId = product.id;
    this.productForm.patchValue(product); // Populate the form with product data
    this.modalRef = this.modalService.show(template); // Pass the template reference
  }

  // Add a new product
  addProduct(product: Product): void {
    this.apiService
      .post<Product>(this._baseEndPoint, product)
      .subscribe((newProduct) => {
        const currentProducts = this.products$.value || [];
        this.products$.next([...currentProducts, newProduct]); // Add the new product to the cache
        this.modalRef?.hide(); // Close the modal
      });
  }

  // Edit an existing product
  updateProduct(id: number, product: Product): void {
    this.apiService
      .put<Product>(`${this._baseEndPoint}/${id}`, product)
      .subscribe((updatedProduct) => {
        const currentProducts = this.products$.value || [];
        const updatedProducts = currentProducts.map((p) =>
          p.id === id ? updatedProduct : p
        );
        this.products$.next(updatedProducts); // Update the cache
        this.modalRef?.hide(); // Close the modal
      });
  }

  // Delete a product
  deleteProduct(id: number): void {
    this.apiService.delete<void>(this._baseEndPoint, id).subscribe(() => {
      const currentProducts = this.products$.value || [];
      const updatedProducts = currentProducts.filter((p) => p.id !== id);
      this.products$.next(updatedProducts); // Update the cache
    });
  }

  // Submit the form
  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    const product: Product = this.productForm.value;

    if (this.isEditMode && this.currentProductId !== null) {
      this.updateProduct(this.currentProductId, product);
    } else {
      this.addProduct(product);
    }
  }

  // Initialize the form
  private initForm(): void {
    this.productForm = this.fb.group({
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
    });
  }
}
