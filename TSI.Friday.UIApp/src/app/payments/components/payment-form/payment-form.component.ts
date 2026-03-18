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
  Transaction,
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  PaymentCondition,
} from '@friday/core';

import { Observable } from 'rxjs';

@Component({
  selector: 'app-payment-form',
  standalone: false,
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  parentId: string | null = null;

  @Input()
  parentData: Transaction | undefined;

  @Input()
  data?: Payment | null;

  @Input()
  compact = false;

  @Output()
  save = new EventEmitter<Payment>();

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

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
    this.disableEditFields();

    // Subscription para price
    this.form.get('price')?.valueChanges.subscribe((price: number) => {
      const payments = this.form.get('totalOfPayments')?.value || 1;
      const validInstallments = payments > 0 ? payments : 1;
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
    this.formSubmitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    this.save.emit(rawValue);
  }

  doCancel(): void {
    this.cancel.emit();
  }

  private initForm(): void {
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
      transactionId: [this.parentId],
      transactionDescription: [this.parentData?.description],
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

  private disableEditFields(): void {
    // if (this.data?.status === PaymentStatus.Approved) {
    //   this.form.disable();
    // }
  }
}
