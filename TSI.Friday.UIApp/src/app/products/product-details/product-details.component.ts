import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ApiService,
  GridService,
  ModalService,
  Product,
  ProductUnit,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  private _baseEndPoint = 'product';

  form!: FormGroup;
  isEditMode = false;
  currentId: number | null = null;
  data?: Product;

  unitOptions = [
    { label: 'Unit', value: ProductUnit.Unit },
    { label: 'Kilogram', value: ProductUnit.Kilogram },
    { label: 'Gram', value: ProductUnit.Gram },
  ];

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private gridService: GridService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const product: Product = this.form.value;

    if (this.isEditMode && this.currentId !== null) {
      this.updateProduct(product);
    } else {
      this.addProduct(product);
    }
  }

  addProduct(product: Product): void {
    this.apiService
      .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
      .subscribe((response: WebApiResponse<Product>) => {
        this.gridService.gridDataChanged(response.data, this.currentId);
        this.modalService.hideModal();
        this.modalService.showNotification(
          true,
          'Produto cadastrado',
          response.message
        );
      });
  }

  updateProduct(product: Product): void {
    this.apiService
      .put<WebApiResponse<Product>>(`${this._baseEndPoint}/update`, product)
      .subscribe((response: WebApiResponse<Product>) => {
        this.gridService.gridDataChanged(response.data, this.currentId);
        this.modalService.hideModal();
        this.modalService.showNotification(
          true,
          'Produto atualizado',
          response.message
        );
      });
  }

  closeModal(): void {
    this.modalService.hideModal();
  }

  private initForm(): void {
    const commonControls = {
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
    };

    this.form = !this.isEditMode
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    if (this.isEditMode && this.data) {
      this.form.patchValue(this.data);
    } else {
      this.form.reset();
    }
  }
}
