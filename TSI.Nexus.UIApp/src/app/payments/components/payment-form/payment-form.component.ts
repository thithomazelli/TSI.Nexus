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
} from '@nexus/core';

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
  parentData: Transaction | Order | null = null;

  @Input()
  data?: Payment | null;

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<PaymentDetailsModalComponent>;

  isInstallment = false;
  showClientAndOrder = false;

  statusOptions = [
    { label: 'Em aberto', value: PaymentStatus.Pending },
    { label: 'Pago', value: PaymentStatus.Approved },
    { label: 'Atrasado', value: PaymentStatus.Delayed },
  ];

  typeOptions = [
    { label: 'Entrada', value: PaymentType.Incoming },
    { label: 'Saída', value: PaymentType.Outgoing },
  ];

  methodOptions = [
    { label: 'Dinheiro', value: PaymentMethod.Cash },
    { label: 'Pix', value: PaymentMethod.Pix },
    { label: 'Cartão de Crédito', value: PaymentMethod.CreditCard },
  ];

  conditionOptions = [
    { label: 'À Vista', value: PaymentCondition.FullPayment },
    { label: 'Parcelado', value: PaymentCondition.InInstallments },
  ];

  categoryOptions = [
    { label: 'Combustível', value: 'Combustível' },
    { label: 'Despesas Fixas', value: 'Despesas Fixas' },
    { label: 'Despesas Variáveis', value: 'Despesas Variáveis' },
    { label: 'Despesas Veículos', value: 'Despesas Veículos' },
    { label: 'Diversos', value: 'Diversos' },
    { label: 'Funcionários', value: 'Funcionários' },
    { label: 'Recebimentos', value: 'Recebimentos' },
  ];

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
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
    this.disableEditFields();

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
          this.notificationService.showMessage('Error', 'Erro ao salvar');
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
        'Deseja realmente excluir este registro?',
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
    let transactionId = '';

    // Is Order
    if (this.parentData && 'transactionId' in this.parentData) {
      transactionDescription = this.parentData.transaction?.description || '';
      orderId = this.parentData?.id || '';
      transactionId = this.parentData?.transactionId || '';
    }

    // Is Transaction
    if (this.parentData && 'orderId' in this.parentData) {
      transactionDescription = this.parentData.description || '';
      orderId = this.parentData?.orderId || '';
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
      orderNumber: [this.parentData?.orderNumber],
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

  private save(payment: Payment): Observable<WebApiResponse<Payment>> {
    return this.isEdit && this.data
      ? this.paymentService.update(payment)
      : this.paymentService.add(payment);
  }
}
