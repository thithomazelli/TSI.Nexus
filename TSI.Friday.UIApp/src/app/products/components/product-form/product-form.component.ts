import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import {
  ApiType,
  CurrencyService,
  FormBaseComponent,
  ModalService,
  NotificationService,
  Product,
  ProductService,
  ProductType,
  ProductUnit,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ProductDetailsModalComponent } from '../product-details-modal/product-details-modal.component';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  standalone: false,
})
export class ProductFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Product | null;

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<ProductDetailsModalComponent>;

  unitOptions = [
    { label: 'Unidade', value: ProductUnit.Unit },
    { label: 'Quilograma', value: ProductUnit.Kilogram },
    { label: 'Grama', value: ProductUnit.Gram },
  ];

  productTypeOptions = [
    { label: 'Venda', value: ProductType.Sale },
    { label: 'Aluguel', value: ProductType.Rental },
    { label: 'Serviço', value: ProductType.Service },
  ];

  private _baseEndPoint: ApiType = ApiType.Products;

  constructor(
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private productService: ProductService,
    private routerService: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // quando data chegar depois do init, apenas patch no form
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }

    // se o modo de edição mudar depois, re-inicializa o form com o novo modo
    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      this.initForm();
    }
  }

  submit(): Observable<WebApiResponse<Product> | null> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    return this.save(this.form.getRawValue() as Product).pipe(
      tap({
        next: (response: WebApiResponse<Product>) => {
          if (this.isModal) {
            this.saveModal(response);
          } else {
            this.savePage(response);
          }
        },
        error: (err) => {
          this.notificationService.showMessage('error', 'Erro ao salvar');
        },
      }),
    );
  }

  cancel(): void {
    if (this.isModal) {
      this.modalService.hideModal(this.dialogRef);
    } else {
      this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
    }
  }

  onPriceBlur(): void {
    const priceControl = this.form.get('priceFormatted');
    if (!priceControl) {
      return;
    }
    const value = this.currencyService.parseCurrencyBRL(priceControl.value);
    priceControl.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get('price')?.setValue(value);
  }

  private initForm(): void {
    const commonControls = {
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: ['', [Validators.required, Validators.min(0)]],
      unit: [ProductUnit.Unit, Validators.required],
      type: [ProductType.Rental, Validators.required],
      quantityInStock: [1, [Validators.required, Validators.min(0)]],
      photo: [''],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const patch = {
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
      };
      this.form.patchValue(patch);
    } else {
      this.form
        .get('priceFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(this.data?.price));
    }

    this.form.get('type')?.valueChanges.subscribe((type) => {
      const quantityControl = this.form.get('quantityInStock');
      if (type === ProductType.Service) {
        quantityControl?.setValue(0);
        quantityControl?.disable();
      } else {
        quantityControl?.enable();
      }
    });
  }

  private save(product: Product): Observable<WebApiResponse<Product>> {
    return this.isEdit && this.data
      ? this.productService.update(product)
      : this.productService.add(product);
  }

  private saveModal(response: WebApiResponse<Product>): void {
    this.dialogRef?.close(response);
    this.modalService.showNotification(
      response.status == ResponseStatus.Success,
      'Produto adicionado',
      response.message,
    );
  }

  private savePage(response: WebApiResponse<Product>): void {
    if (this.isEdit && this.data) {
      this.notificationService.showMessage(response.status, response.message);
      this.data = response.data;
    } else {
      this.routerService.navigateByUrl(
        `/${this._baseEndPoint}/${response.data.id}`,
      );
    }
  }
}
