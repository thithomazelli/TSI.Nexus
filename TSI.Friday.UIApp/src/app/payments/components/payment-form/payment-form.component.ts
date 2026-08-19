import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import {
  BusinessPartner,
  CurrencyService,
  FormBaseComponent,
  Order,
  Trip,
  Transaction,
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  PaymentCondition,
  WebApiResponse,
  NotificationService,
  PaymentService,
  ModalService,
  SelectableOption,
  SelectableOptionGroup,
  SelectableOptionService,
  TranslationService,
} from '@friday/core';

import { Observable, of, Subscription, tap } from 'rxjs';
import { PaymentDetailsModalComponent } from '../payment-details-modal/payment-details-modal.component';

@Component({
  selector: 'app-payment-form',
  standalone: false,
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  parentId: string | null = null;

  @Input()
  parentData: Transaction | Order | Trip | null = null;

  @Input()
  data?: Payment | null;

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<PaymentDetailsModalComponent>;

  isInstallment = false;
  showClientAndOrder = false;

  get statusOptions() {
    return [
      { label: this.translationService.instant('REPORTS.STATUS_OPEN'), value: PaymentStatus.Pending },
      { label: this.translationService.instant('REPORTS.STATUS_PAID'), value: PaymentStatus.Approved },
      { label: this.translationService.instant('REPORTS.STATUS_DELAYED'), value: PaymentStatus.Delayed },
    ];
  }

  get typeOptions() {
    return [
      { label: this.translationService.instant('REPORTS.INCOMING'), value: PaymentType.Incoming },
      { label: this.translationService.instant('REPORTS.OUTGOING'), value: PaymentType.Outgoing },
    ];
  }

  get methodOptions() {
    return [
      { label: this.translationService.instant('TRANSACTIONS.METHOD_CASH'), value: PaymentMethod.Cash },
      { label: this.translationService.instant('TRANSACTIONS.METHOD_PIX'), value: PaymentMethod.Pix },
      { label: this.translationService.instant('TRANSACTIONS.METHOD_CREDIT_CARD'), value: PaymentMethod.CreditCard },
    ];
  }

  get conditionOptions() {
    return [
      { label: this.translationService.instant('TRANSACTIONS.FULL_PAYMENT'), value: PaymentCondition.FullPayment },
      { label: this.translationService.instant('TRANSACTIONS.IN_PAYMENTS'), value: PaymentCondition.InInstallments },
    ];
  }

  categories: SelectableOption[] = [];

  businessPartners$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;

  private _subscriptions: Subscription[] = [];

  constructor(
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private paymentService: PaymentService,
    private selectableOptionService: SelectableOptionService,
    private translationService: TranslationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
    this.disableEditFields();
    this.loadCategories();

    // Subscription para price
    this._subscriptions.push(
      this.form.get('price')!.valueChanges.subscribe((price: number) => {
        const payments = this.form.get('totalOfPayments')?.value || 1;
        const validInstallments = payments > 0 ? payments : 1;
        const perInstallment = price / validInstallments;
        this.form.get('pricePerInstallment')?.setValue(perInstallment);
        this.form
          .get('pricePerInstallmentFormatted')
          ?.setValue(this.currencyService.formatCurrencyBRL(perInstallment));
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }
    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      this.initForm();
    }
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onCurrencyBlur(formControlName: string): void {
    const priceControl = this.form.get(`${formControlName}Formatted`);
    if (!priceControl) {
      return;
    }

    const value = this.currencyService.parseCurrencyBRL(priceControl.value);
    priceControl.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get(formControlName)?.setValue(value);
  }

  submit(): Observable<WebApiResponse<Payment> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();
    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    return this.save(rawValue as Payment).pipe(
      tap({
        next: (response: WebApiResponse<Payment>) => {
          this.dialogRef?.close(response);
          this.modalService.showSweetNotification(
            '',
            response.message,
            response.status,
          );
        },
        error: (err) => {
          this.notificationService.showMessage('Error', this.translationService.instant('COMMON.SAVE_ERROR'));
        },
      }),
    );
  }

  cancel(): void {
    this.modalService.hideModal(this.dialogRef);
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
          this.paymentService
            .delete(this.data as Payment)
            .pipe(
              tap({
                next: (response: WebApiResponse<Payment>) => {
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
              PaymentDetailsModalComponent,
              initialState,
            );
          }
        }
      });
  }

  private initForm(): void {
    let transactionDescription = '';
    let orderId = '';
    let tripId = '';
    let transactionId = '';

    // Is Order or Trip (both are root entities with an embedded Transaction)
    if (this.parentData && 'transactionId' in this.parentData) {
      transactionDescription = this.parentData.transaction?.description || '';
      transactionId = this.parentData?.transactionId || '';
      if ('tripNumber' in this.parentData) {
        tripId = this.parentData?.id || '';
      } else {
        orderId = this.parentData?.id || '';
      }
    }

    // Is Transaction
    if (this.parentData && 'orderId' in this.parentData) {
      transactionDescription = this.parentData.description || '';
      orderId = this.parentData?.orderId || '';
      tripId = this.parentData?.tripId || '';
      transactionId = this.parentId ?? '';
    }

    const commonControls = {
      type: ['', Validators.required],
      status: ['', Validators.required],
      condition: ['', Validators.required],
      method: ['', Validators.required],
      category: ['', Validators.required],
      date: [new Date(), Validators.required],
      description: ['', Validators.required],
      installmentNumber: [0],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: [{ value: 0 }],
      transactionId: [transactionId],
      transactionDescription: [transactionDescription],
      businessPartnerId: [this.parentData?.businessPartnerId],
      businessPartnerName: [this.parentData?.businessPartnerName],
      orderId: [orderId],
      orderNumber: [(this.parentData as any)?.orderNumber],
      tripId: [tripId],
      tripNumber: [(this.parentData as any)?.tripNumber],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    // Bloqueia campos quando isEdit for true
    if (this.isEdit && this.form) {
      this.form.get('businessPartnerName')?.disable();
      this.form.get('orderNumber')?.disable();
      this.form.get('type')?.disable();
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      this.form.patchValue({
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
      });
    } else {
      this.form
        .get('priceFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(this.data?.price));
    }
  }

  private disableEditFields(): void {
    if (this.data?.status === PaymentStatus.Approved) {
      this.form.disable();
    }
  }

  private loadCategories(): void {
    this.selectableOptionService
      .getByGroup(SelectableOptionGroup.TransactionCategory)
      .subscribe((response) => {
        this.categories = response.data ?? [];
      });
  }

  private save(payment: Payment): Observable<WebApiResponse<Payment>> {
    return this.isEdit && this.data
      ? this.paymentService.update(payment)
      : this.paymentService.add(payment);
  }
}
