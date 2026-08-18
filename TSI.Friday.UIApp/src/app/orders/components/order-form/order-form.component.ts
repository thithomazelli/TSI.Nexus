import { combineLatestWith, of, Subscription, tap } from 'rxjs';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  TranslationService,
} from '@friday/core';

import { MatDialogRef } from '@angular/material/dialog';

import { Observable, startWith, map } from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { OrderProductsDetailsModalComponent } from '../../../order-products/components/order-product-details-modal/order-products-details-modal.component';
import { OrderDetailsModalComponent } from '../order-details-modal/order-details-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
  standalone: false,
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

  get orderStatusOptions() {
    return [
      { value: OrderStatus.Open, label: this.translationService.instant('QUOTES.STATUS_OPEN') },
      { value: OrderStatus.Closed, label: this.translationService.instant('QUOTES.STATUS_CLOSED') },
      { value: OrderStatus.WaitingPayment, label: this.translationService.instant('QUOTES.STATUS_WAITING_PAYMENT') },
    ];
  }

  private _subscriptions: Subscription[] = [];
  private _baseEndPoint = ApiType.Orders;
  private statusSubscription?: Subscription;
  private totalOfPaymentsSubscription?: Subscription;

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private orderService: OrderService,
    private orderProductService: OrderProductService,
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
    this.setupStatusWatcher();
    this.setupTotalOfPaymentsWatcher();

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
      this.setupStatusWatcher();
      this.setupTotalOfPaymentsWatcher();
    }
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
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

      // Ensure markAllOrderProductsAsReturned is sent
      if (rawValue.markAllOrderProductsAsReturned !== undefined) {
        this.data!.markAllProductsAsReturned =
          rawValue.markAllOrderProductsAsReturned;
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

    if (!this.form.get('businessPartnerId')?.value) {
      this.modalService.showNotification(
        false,
        '',
        this.translationService.instant('ORDERS.SELECT_CLIENT_HINT'),
      );
      return;
    }

    this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialState,
    );
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
                      width: '600px',
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
      priceFormatted: [{ value: 0, disabled: true }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      totalPriceFormatted: [{ value: 0, disabled: true }],
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
        paymentTotalPrice: [0, [Validators.min(0)]],
        paymentTotalPriceFormatted: [{ value: 0, disabled: true }],
        totalOfExpenses: [
          {
            value: 0,
            disabled: this.isEdit ? true : false,
          },
          Validators.required,
        ],
        expenseTotalPrice: [0, [Validators.min(0)]],
        expenseTotalPriceFormatted: [
          { value: 0, disabled: this.isEdit ? true : false },
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
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
        totalPriceFormatted: this.currencyService.formatCurrencyBRL(
          this.data.totalPrice,
        ),
        transaction: {
          ...this.data.transaction,
          id: this.data.transaction?.id ?? null,
          paymentTotalPriceFormatted:
            this.currencyService.formatCurrencyBRL(paymentTotalPrice),
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
    this.form
      .get('priceFormatted')
      ?.setValue(this.currencyService.formatCurrencyBRL(total));
  }

  private updateTotalPriceFields(): void {
    const price = Number(this.form.get('price')?.value) || 0;
    const discount = Number(this.form.get('discount')?.value) || 0;
    const total = price * (1 - discount / 100);
    this.form.get('totalPrice')?.setValue(total);
    this.form
      .get('totalPriceFormatted')
      ?.setValue(this.currencyService.formatCurrencyBRL(total));

    const transactionGroup = this.form.get('transaction') as FormGroup | null;
    if (!this.isEdit && transactionGroup) {
      const transactions = transactionGroup.get('totalOfPayments')?.value || 1;
      const pricePerPayment = total / (transactions > 0 ? transactions : 1);
      transactionGroup.get('paymentTotalPrice')?.setValue(total);
      transactionGroup
        .get('paymentTotalPriceFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(pricePerPayment));
    }
  }

  private setupStatusWatcher(): void {
    if (!this.isEdit || !this.form || !this.data?.hasOpenedProducts) {
      return;
    }
    // Remove previous subscription if any
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    // Add the field to the form if it does not exist
    if (!this.form.contains('markAllOrderProductsAsReturned')) {
      this.form.addControl(
        'markAllOrderProductsAsReturned',
        this.formBuilder.control(false),
      );
    }
    this.statusSubscription = this.form
      .get('status')
      ?.valueChanges.subscribe(async (newStatus: OrderStatus) => {
        if (newStatus === OrderStatus.Closed) {
          const confirmed = await this.modalService
            .showConfirmation({
              title: this.translationService.instant('ORDERS.CLOSE_ORDER'),
              message: this.translationService.instant('ORDERS.CONFIRM_RETURN_ALL'),
              confirmButtonText: this.translationService.instant('COMMON.YES'),
              cancelButtonText: this.translationService.instant('COMMON.NO'),
            })
            .afterClosed()
            .toPromise();
          this.form
            .get('markAllOrderProductsAsReturned')
            ?.setValue(!!confirmed);
          if (this.data) {
            this.data.markAllProductsAsReturned = !!confirmed;
          }
        } else {
          this.form.get('markAllOrderProductsAsReturned')?.setValue(false);
          if (this.data) this.data.markAllProductsAsReturned = false;
        }
      });
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
