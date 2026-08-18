import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
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
  TranslationService,
  WebApiResponse,
} from '@friday/core';

import { Observable, of, Subscription } from 'rxjs';
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
  implements OnInit, OnChanges, OnDestroy
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

  get categories() {
    return [
      { label: this.translationService.instant('PRODUCTS.CATEGORY_ELECTRIC'), value: 'Electric' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_HYDRAULICS'), value: 'Hydraulics' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_STRUCTURE'), value: 'Structure' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_DRYWALL'), value: 'Drywall' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_PAINTING'), value: 'Painting' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_FINISHING'), value: 'Finishing' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_SANITARY'), value: 'Sanitary' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_EQUIPMENT'), value: 'Equipment' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_FIXING'), value: 'Fixing' },
      { label: this.translationService.instant('PRODUCTS.CATEGORY_FINISHING'), value: 'Finish' },
    ];
  }

  get unitOptions() {
    return [
      { label: this.translationService.instant('PRODUCTS.UNIT_UNIT'), value: ProductUnit.Unit },
      { label: this.translationService.instant('PRODUCTS.UNIT_KILOGRAM'), value: ProductUnit.Kilogram },
      { label: this.translationService.instant('PRODUCTS.UNIT_GRAM'), value: ProductUnit.Gram },
    ];
  }

  get productTypeOptions() {
    return [
      { label: this.translationService.instant('PRODUCTS.TYPE_SALE'), value: ProductType.Sale },
      { label: this.translationService.instant('PRODUCTS.TYPE_RENTAL'), value: ProductType.Rental },
      { label: this.translationService.instant('PRODUCTS.SINGULAR'), value: ProductType.Service },
    ];
  }

  private _baseEndPoint: ApiType = ApiType.Products;
  private _subscriptions: Subscription[] = [];

  constructor(
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private productService: ProductService,
    private routerService: Router,
    private translationService: TranslationService,
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

  ngOnDestroy(): void {
    this._subscriptions.forEach(
      (sub) =>
        sub && typeof sub.unsubscribe === 'function' && sub.unsubscribe(),
    );
    this._subscriptions = [];
  }

  submit(): Observable<WebApiResponse<Product> | null> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();

    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    return this.save(rawValue as Product).pipe(
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

  remove(): void {
    this.modalService.hideModal();
    this.modalService
      .showSweetConfirmation(
        '',
        'Deseja realmente excluir este registro?',
        'question',
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.productService
            .delete(this.data as Product)
            .pipe(
              tap({
                next: (response: WebApiResponse<Product>) => {
                  if (this.isModal) {
                    this.modalService.hideModal(this.dialogRef);
                    this.modalService.showSweetNotification(
                      '',
                      response.message,
                      response.status,
                    );
                  } else {
                    this.modalService.showSweetNotification(
                      '',
                      response.message,
                      response.status,
                    );
                    if (response.status === ResponseStatus.Success) {
                      this.routerService.navigateByUrl(
                        `/${this._baseEndPoint}`,
                      );
                    }
                  }
                },
                error: (err) => {
                  this.notificationService.showMessage(
                    'error',
                    'Erro ao remover',
                  );
                },
              }),
            )
            .subscribe();
        } else {
          if (this.isModal) {
            const initialState = {
              isEdit: this.isEdit,
              data: this.data,
              id: this.data?.id,
            };
            this.modalService.showTemplateModal(
              ProductDetailsModalComponent,
              initialState,
            );
          }
        }
      });
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
      category: ['', Validators.required],
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

    const typeSub = this.form.get('type')?.valueChanges.subscribe((type) => {
      const quantityControl = this.form.get('quantityInStock');
      if (type === ProductType.Service) {
        quantityControl?.setValue(0);
        quantityControl?.disable();
      } else {
        quantityControl?.enable();
      }
    });
    if (typeSub) {
      this._subscriptions.push(typeSub);
    }
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
