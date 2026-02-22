import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';

import {
  BusinessPartner,
  CurrencyService,
  FormBaseComponent,
  Order,
  Payment,
  PaymentInstallment,
} from '@friday/core';
import { PaymentStatus } from '@friday/core';
import { PaymentType } from '@friday/core';
import { PaymentMethod } from '@friday/core';

import { Observable } from 'rxjs';

@Component({
  selector: 'app-payment-installment-form',
  standalone: false,
  templateUrl: './payment-installment-form.component.html',
  styleUrl: './payment-installment-form.component.scss',
})
export class PaymentInstallmentFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  parentId: string | null = null;

  @Input()
  parentData: Payment | undefined;

  @Input()
  data?: Payment | null;

  @Input()
  compact = false;

  @Output()
  save = new EventEmitter<PaymentInstallment>();

  @Output()
  cancel = new EventEmitter<void>();

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

  businessPartners$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();

    // Subscription para price
    this.form.get('price')?.valueChanges.subscribe((price: number) => {
      const installments = this.form.get('totalOfInstallments')?.value || 1;
      const validInstallments = installments > 0 ? installments : 1;
      const perInstallment = price / validInstallments;
      this.form.get('pricePerInstallment')?.setValue(perInstallment);
      this.form
        .get('pricePerInstallmentFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(perInstallment));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }
    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      this.initForm();
    }
  }

  ngOnDestroy(): void {}

  onCurrencyBlur(formControlName: string): void {
    const priceControl = this.form.get(`${formControlName}Formatted`);
    if (!priceControl) {
      return;
    }

    const value = this.currencyService.parseCurrencyBRL(priceControl.value);
    priceControl.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get(formControlName)?.setValue(value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    // paymentId: [this.parentId],
    // businessPartnerId: [this.parentData?.businessPartnerId],
    // businessPartnerName: [this.parentData?.businessPartnerName],
    // orderId: [this.parentData?.orderId],
    // orderNumber: [this.parentData?.orderNumber],

    this.save.emit(rawValue);
  }

  doCancel(): void {
    this.cancel.emit();
  }

  private initForm(): void {
    const commonControls = {
      type: ['', Validators.required],
      method: ['', Validators.required],
      status: ['', Validators.required],
      date: [new Date(), Validators.required],
      description: ['', Validators.required],
      installmentNumber: [0],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: [{ value: 0 }],
      paymentId: [this.parentId],
      businessPartnerId: [this.parentData?.businessPartnerId],
      businessPartnerName: [this.parentData?.businessPartnerName],
      orderId: [this.parentData?.orderId],
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
}
