import { of, Subscription, tap } from 'rxjs';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import {
  BusinessPartnerService,
  BusinessPartner,
  Order,
  OrderStatus,
  FormBaseComponent,
  ModalService,
  CurrencyService,
  PaymentType,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  WebApiResponse,
  ApiType,
  ResponseStatus,
  NotificationService,
  OrderService,
  OrderProductService,
  OrderProduct,
  ProductService,
  Product,
  ProductType,
  TranslationService,
} from '@friday/core';

import { MatDialogRef } from '@angular/material/dialog';

import { Observable, startWith, map, combineLatestWith } from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { OrderProductsDetailsModalComponent } from '../../../order-products/components/order-product-details-modal/order-products-details-modal.component';
import { OrderDetailsModalComponent } from '../order-details-modal/order-details-modal.component';
import { ProductDetailsModalComponent } from '../../../products/components/product-details-modal/product-details-modal.component';
import { Router } from '@angular/router';
import { AlertBannerComponentComponent } from '../../../shared/alert-banner-component/alert-banner-component.component';
import { NgIf, NgClass, NgFor, AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatAutocompleteTrigger, MatAutocomplete, MatOption } from '@angular/material/autocomplete';
import { LinkFieldComponent } from '../../../shared/components/link-field/link-field.component';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { CurrencyFieldComponent } from '../../../shared/components/currency-field/currency-field.component';
import { TransactionFormComponent } from '../../../transactions/components/transactions-form/transaction-form.component';
import { ClickDirective } from '../../../core/directives/click.directive';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-order-form',
    templateUrl: './order-form.component.html',
    styleUrl: './order-form.component.scss',
    imports: [
        AlertBannerComponentComponent,
        ReactiveFormsModule,
        NgIf,
        NgClass,
        MatAutocompleteTrigger,
        MatAutocomplete,
        NgFor,
        MatOption,
        LinkFieldComponent,
        DateFieldComponent,
        CurrencyFieldComponent,
        TransactionFormComponent,
        ClickDirective,
        AsyncPipe,
        CurrencyPipe,
        TranslatePipe,
    ],
})
export class OrderFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Order | null = <Order>{
    orderProducts: [],
  };

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<OrderDetailsModalComponent>;

  canDisplayTransactionForm: boolean = true;
  businessPartners$!: Observable<WebApiResponse<BusinessPartner[]>>;
  businessPartnersArray$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  inlineProductForm!: FormGroup;
  filteredInlineProductsSku$!: Observable<Product[]>;
  private _products: Product[] = [];

  get orderStatusOptions() {
    return [
      { value: OrderStatus.Open, label: this.translationService.instant('QUOTES.STATUS_OPEN') },
      { value: OrderStatus.Closed, label: this.translationService.instant('QUOTES.STATUS_CLOSED') },
      { value: OrderStatus.WaitingPayment, label: this.translationService.instant('QUOTES.STATUS_WAITING_PAYMENT') },
    ];
  }

  // orderStatusOptions is a getter, so *ngFor's default identity-based tracking sees a brand new
  // array/objects on every change-detection pass and keeps destroying/recreating the <option>
  // elements - severe enough churn on a bound <select> to trip NG0103 (infinite change detection).
  trackByOptionValue(_index: number, option: { value: string; label: string }): string {
    return option.value;
  }

  private _subscriptions: Subscription[] = [];
  private _baseEndPoint = ApiType.Orders;
  private totalOfPaymentsSubscription?: Subscription;

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private orderService: OrderService,
    private orderProductService: OrderProductService,
    private productService: ProductService,
    private routerService: Router,
    private translationService: TranslationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.disableEditFields();
    this.patchFormWithData();
    this.setupAutoComplete();
    this.totalPriceChange();
    this.setupTotalOfPaymentsWatcher();
    // The inline staged-product table (and its SKU autocomplete) only renders in Add mode - see
    // *ngIf="!isEdit" on that section in the template - so setting it up in Edit mode was just an
    // unused productService.getAll() call on every order opened for editing.
    if (!this.isEdit) {
      this.initInlineProductForm();
      this.setupInlineProductAutoComplete();
    }

    this._subscriptions.push(
      this.orderProductService.orderProductAdded$.subscribe((orderProduct) => {
        if (orderProduct) {
          this.data?.orderProducts?.push(orderProduct);
          this.updatePriceFields();
          this.updateTotalPriceFields();
          this.modalService.showNotification(
            true,
            '',
            this.translationService.instant('ORDERS.PRODUCT_ADDED_SUCCESS'),
          );
        }
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.form) {
      this.patchFormWithData();
      this.setupTotalOfPaymentsWatcher();
    }
  }

  ngOnDestroy(): void {
    if (this.totalOfPaymentsSubscription) {
      this.totalOfPaymentsSubscription.unsubscribe();
    }
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  submit(): Observable<WebApiResponse<Order> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();

    // Ensure transactionGroup has the updated client fields
    if (this.canDisplayTransactionForm) {
      if (rawValue.transaction) {
        rawValue.transaction.businessPartnerId = rawValue.businessPartnerId;
        rawValue.transaction.businessPartnerName = rawValue.businessPartnerName;
      }

    }

    // Garante que o id da transação seja preservado
    if (rawValue.transaction && this.data?.transaction?.id) {
      rawValue.transaction.id = this.data.transaction.id;
    }

    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    if (
      this.canDisplayTransactionForm &&
      this.data?.transaction &&
      this.data.transaction.id == null
    ) {
      delete this.data.transaction.id;
    }

    return this.save(this.data as Order).pipe(
      tap({
        next: (response: WebApiResponse<Order>) => {
          // The backend reports business-rule failures as a 200 response with status Error and
          // data: null rather than an HTTP error, so this has to be checked before treating the
          // save as successful - otherwise savePage()/saveModal() crash reading .id off a null
          // response.data.
          if (response.status !== ResponseStatus.Success) {
            this.notificationService.showMessage(response.status, response.message);
            return;
          }
          if (this.isModal) {
            this.saveModal(response);
          } else {
            this.savePage(response);
          }
        },
        error: (err) => {
          this.notificationService.showMessage('Error', this.translationService.instant('COMMON.SAVE_ERROR'));
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
        this.translationService.instant('GRID.CONFIRM_DELETE'),
        'question',
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.orderService
            .delete(this.data as Order)
            .pipe(
              tap({
                next: (response: WebApiResponse<Order>) => {
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
                    this.translationService.instant('ORDERS.REMOVE_ERROR'),
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
              OrderDetailsModalComponent,
              initialState,
            );
          }
        }
      });
  }

  removeProduct(index: number): void {
    if (!this.data?.orderProducts) {
      return;
    }
    this.data.orderProducts.splice(index, 1);
    this.updatePriceFields();
    this.updateTotalPriceFields();
  }

  openOrderProductsModal() {
    const data = { ...this.data, ...this.form.getRawValue() };

    const initialState = {
      isEdit: false,
      id: null,
      parentId: null,
      parentData: data,
    };

    this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialState,
    );
  }

  async onInlineProductSkuBlur(): Promise<void> {
    setTimeout(() => {
      const productSku = this.inlineProductForm.get('productSku')!.value?.trim();
      if (!productSku) {
        this.cleanInlineProductSelection();
        return;
      }
      const found = this._products.find((p) => p.sku === productSku);
      if (found) {
        return;
      }
      const confirmRef = this.modalService.showConfirmation({
        title: this.translationService.instant('COMMON.ENTITY_NOT_FOUND', { entity: this.translationService.instant('PRODUCTS.SINGULAR') }),
        message: this.translationService.instant('COMMON.CONFIRM_ADD_ENTITY', { entityLower: this.translationService.instant('PRODUCTS.SINGULAR').toLowerCase(), name: productSku }),
        cancelButtonText: this.translationService.instant('COMMON.CANCEL'),
        confirmButtonText: this.translationService.instant('COMMON.YES'),
      });
      confirmRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          const productFormRef: MatDialogRef<any> = this.modalService.showTemplateModal(
            ProductDetailsModalComponent,
            {
              data: { sku: productSku },
              disableClose: true,
            },
          );
          productFormRef
            .afterClosed()
            .subscribe((result: WebApiResponse<Product> | undefined) => {
              if (result) {
                this._products.push(result.data);
                this.selectInlineProduct(result.data);
              } else {
                this.cleanInlineProductSelection();
              }
            });
        } else {
          this.cleanInlineProductSelection();
        }
      });
    }, 200);
  }

  selectInlineProduct(product: Product): void {
    if (!product) {
      return;
    }

    if (
      product.type !== ProductType.Service &&
      (product.quantityInStock === undefined ||
        product.quantityInStock === null ||
        product.quantityInStock <= 0)
    ) {
      this.modalService.showNotification(
        false,
        this.translationService.instant('PRODUCTS.OUT_OF_STOCK_TITLE'),
        this.translationService.instant('PRODUCTS.OUT_OF_STOCK_MESSAGE', { name: product.name + '' }),
      );
      this.cleanInlineProductSelection();
      return;
    }

    this.inlineProductForm.patchValue({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      productType: product.type,
      price: product.price,
    });
  }

  onInlineQuantityBlur(): void {
    const quantityControl = this.inlineProductForm.get('quantity');
    const productSku = this.inlineProductForm.get('productSku')?.value;
    if (!quantityControl || !productSku) {
      return;
    }

    const product = this._products.find((p) => p.sku === productSku);
    if (product?.quantityInStock == null) {
      return;
    }

    const quantity = Number(quantityControl.value);
    if (quantity > product.quantityInStock) {
      this.modalService.showNotification(
        false,
        this.translationService.instant('PRODUCTS.STOCK_EXCEEDED_TITLE'),
        this.translationService.instant('PRODUCTS.STOCK_EXCEEDED_MESSAGE', { qty: quantity + '', stock: product.quantityInStock + '' }),
      );
      quantityControl.setValue(1);
    }
  }

  addInlineProduct(): void {
    const raw = this.inlineProductForm.getRawValue();
    if (!raw.productId || !raw.productSku) {
      return;
    }

    const quantity = Number(raw.quantity) || 1;
    const price = Number(raw.price) || 0;
    const totalPrice = price * quantity;

    const orderProduct = {
      productId: raw.productId,
      productSku: raw.productSku,
      productName: raw.productName,
      productType: raw.productType,
      quantity,
      price,
      priceFormatted: this.currencyService.formatCurrencyBRL(price),
      discount: 0,
      totalPrice,
      totalPriceFormatted: this.currencyService.formatCurrencyBRL(totalPrice),
    } as unknown as OrderProduct;

    this.orderProductService.addTemporary(orderProduct).subscribe();
    this.cleanInlineProductSelection();
  }

  get transactionFormGroup(): FormGroup {
    return this.form.get('transaction') as FormGroup;
  }

  async onClientBlur(): Promise<void> {
    setTimeout(() => {
      const businessPartnerName = this.form
        .get('businessPartnerName')!
        .value?.trim();
      if (!businessPartnerName) {
        this.cleanClientSelection();
        return;
      }
      // Sempre checa a lista de clientes, mesmo se businessPartnerId estiver vazio
      const sub = this.businessPartnersArray$.subscribe((clients) => {
        const found = clients.find((c) => c.name === businessPartnerName);
        if (!found) {
          const confirmRef = this.modalService.showConfirmation({
            title: this.translationService.instant('COMMON.ENTITY_NOT_FOUND', { entity: this.translationService.instant('BUSINESS_PARTNER.CLIENT_SINGULAR') }),
            message: this.translationService.instant('COMMON.CONFIRM_ADD_ENTITY', { entityLower: this.translationService.instant('BUSINESS_PARTNER.CLIENT_SINGULAR').toLowerCase(), name: businessPartnerName }),
            cancelButtonText: this.translationService.instant('COMMON.CANCEL'),
            confirmButtonText: this.translationService.instant('COMMON.YES'),
          });
          const confirmSub = confirmRef
            .afterClosed()
            .subscribe((confirmed: boolean) => {
              if (confirmed) {
                // Open modal to add client
                const clientFormRef: MatDialogRef<any> =
                  this.modalService.showTemplateModal(
                    BusinessPartnerDetailsModalComponent,
                    {
                      data: { name: businessPartnerName },
                      disableClose: true,
                    },
                  );
                const clientFormSub = clientFormRef
                  .afterClosed()
                  .subscribe((result: BusinessPartner | undefined) => {
                    if (result) {
                      this.businessPartnerService.addOrUpdateBusinessPartner(
                        result,
                      );
                      this.form
                        .get('businessPartnerName')!
                        .setValue(result.name);
                      this.form.get('businessPartnerId')!.setValue(result.id);
                    } else {
                      this.cleanClientSelection();
                    }
                  });
                this._subscriptions.push(clientFormSub);
              } else {
                this.cleanClientSelection();
              }
            });
          this._subscriptions.push(confirmSub);
        }
      });
      this._subscriptions.push(sub);
    }, 200);
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      orderNumber: [''],
      quoteNumber: [''],
      businessPartnerId: [null, Validators.required],
      businessPartnerName: [
        { value: '', disabled: this.data?.businessPartnerId != null },
        Validators.required,
      ],
      description: [''],
      date: [new Date(), Validators.required],
      status: [OrderStatus.Open, Validators.required],
      price: [{ value: 0, disabled: true }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      transactionId: [null],
    });

    this.addTransactionForm();

    if (this.isEdit) {
      this.form.addControl('id', this.formBuilder.control(''));
    } else {
      this._subscriptions.push(
        this.form.get('businessPartnerName')!.valueChanges.subscribe((name) => {
          const sub = this.businessPartnersArray$.subscribe(
            (businessPartners) => {
              const businessPartner = businessPartners.find(
                (p: BusinessPartner) => p.name === name,
              );
              if (businessPartner) {
                this.form
                  .get('businessPartnerId')!
                  .setValue(businessPartner.id);
              }
            },
          );
          this._subscriptions.push(sub);
        }),
      );
    }
  }

  private addTransactionForm(): void {
    if (!this.form.contains('transaction')) {
      const transactionGroup = this.formBuilder.group({
        id: [null],
        type: [PaymentType.Incoming],
        date: [new Date(), Validators.required],
        method: [PaymentMethod.Cash, Validators.required],
        status: [PaymentStatus.Pending, Validators.required],
        category: ['Recebimentos'],
        condition: [
          {
            value: PaymentCondition.FullPayment,
            disabled: this.isEdit ? true : false,
          },
        ],
        totalOfPayments: [
          {
            value: 1,
            disabled: this.isEdit ? true : false,
          },
          Validators.required,
        ],
        paymentTotalPrice: [{ value: 0, disabled: true }, [Validators.min(0)]],
        totalOfExpenses: [
          {
            value: 0,
            disabled: this.isEdit ? true : false,
          },
          Validators.required,
        ],
        expenseTotalPrice: [
          { value: 0, disabled: this.isEdit ? true : false },
          [Validators.min(0)],
        ],
      });
      this.form.addControl('transaction', transactionGroup);
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const paymentTotalPrice = !this.isEdit
        ? (this.data.totalPrice ?? 0) /
          (this.data.transaction?.totalOfPayments || 1)
        : this.data.transaction?.paymentTotalPrice;

      const patch = {
        ...this.data,
        transaction: {
          ...this.data.transaction,
          id: this.data.transaction?.id ?? null,
          paymentTotalPrice,
        },
      };

      this.form.patchValue(patch);
    }
  }

  private cleanClientSelection(): void {
    this.form.get('businessPartnerId')!.setValue('');
    this.markAsTouched('businessPartnerId');
    this.form.get('businessPartnerId')!.setErrors({ required: true });
    this.form.get('businessPartnerName')!.setValue('');
    this.markAsTouched('businessPartnerName');
    this.form.get('businessPartnerName')!.setErrors({ required: true });
  }

  private setupAutoComplete(): void {
    this.businessPartners$ = this.businessPartnerService.getClients();
    this.businessPartnersArray$ = this.businessPartners$.pipe(
      map((response) => response.data ?? []),
    );

    this.filteredBusinessPartners$ = this.form
      .get('businessPartnerName')!
      .valueChanges.pipe(
        startWith(''),
        combineLatestWith(this.businessPartnersArray$),
        map(([value, businessPartners]) => {
          const filterValue = (value || '').toLowerCase();
          if (!filterValue) {
            return [];
          }
          return businessPartners.filter((businessPartner: BusinessPartner) =>
            (businessPartner.name || '').toLowerCase().includes(filterValue),
          );
        }),
      );
  }

  private initInlineProductForm(): void {
    this.inlineProductForm = this.formBuilder.group({
      productId: [''],
      productSku: [''],
      productName: [''],
      productType: [''],
      price: [0],
      quantity: [1, [Validators.min(1)]],
    });
  }

  private setupInlineProductAutoComplete(): void {
    const productsArray$ = this.productService.getAll().pipe(
      map((response) => response.data ?? []),
    );

    this._subscriptions.push(
      productsArray$.subscribe((products) => (this._products = products)),
    );

    this.filteredInlineProductsSku$ = this.inlineProductForm
      .get('productSku')!
      .valueChanges.pipe(
        startWith(''),
        combineLatestWith(productsArray$),
        map(([value, products]) => {
          const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
          if (!filterValue) {
            return [];
          }
          return products
            .filter((product: Product) =>
              (product.sku || '').toLowerCase().includes(filterValue),
            )
            .map((product: Product) => ({
              ...product,
              alreadyUsed: this.data?.orderProducts?.some(
                (op) => op.productId === product.id,
              ),
              disabled:
                product.quantityInStock !== undefined &&
                product.quantityInStock <= 0,
            }));
        }),
      );
  }

  private cleanInlineProductSelection(): void {
    this.inlineProductForm.reset({
      productId: '',
      productSku: '',
      productName: '',
      productType: '',
      price: 0,
      quantity: 1,
    });
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('businessPartnerName')?.disable();
      this.form.get('orderNumber')?.disable();
    }
  }

  private totalPriceChange(): void {
    this.form
      .get('discount')
      ?.valueChanges.subscribe(() => this.updateTotalPriceFields());
  }

  private updatePriceFields(): void {
    const total = this.data?.orderProducts?.reduce(
      (sum, p) => sum + (p?.totalPrice || 0),
      0,
    );
    this.data!.price = total;
    this.form.get('price')?.setValue(total);
  }

  private updateTotalPriceFields(): void {
    const price = Number(this.form.get('price')?.value) || 0;
    const discount = Number(this.form.get('discount')?.value) || 0;
    const total = price * (1 - discount / 100);
    this.form.get('totalPrice')?.setValue(total);

    const transactionGroup = this.form.get('transaction') as FormGroup | null;
    if (!this.isEdit && transactionGroup) {
      transactionGroup.get('paymentTotalPrice')?.setValue(total);
    }
  }

  private setupTotalOfPaymentsWatcher(): void {
    // Remove subscription anterior se existir
    if (this.totalOfPaymentsSubscription) {
      this.totalOfPaymentsSubscription.unsubscribe();
    }
    const transactionGroup = this.form.get('transaction') as FormGroup | null;
    if (transactionGroup && transactionGroup.get('totalOfPayments')) {
      this.totalOfPaymentsSubscription = transactionGroup
        .get('totalOfPayments')!
        .valueChanges.subscribe(() => {
          this.updateTotalPriceFields();
        });
    }
  }

  private save(order: Order): Observable<WebApiResponse<Order>> {
    return this.isEdit && this.data
      ? this.orderService.update(order)
      : this.orderService.add(order);
  }

  private saveModal(response: WebApiResponse<Order>): void {
    this.dialogRef?.close(response);
    this.modalService.showNotification(
      response.status == ResponseStatus.Success,
      this.translationService.instant('ORDERS.ORDER_ADDED'),
      response.message,
    );
  }

  private savePage(response: WebApiResponse<Order>): void {
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
