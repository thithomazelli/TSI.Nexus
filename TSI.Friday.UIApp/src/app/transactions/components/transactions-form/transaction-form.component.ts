import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import {
  BusinessPartner,
  BusinessPartnerService,
  CurrencyService,
  FormBaseComponent,
  ModalService,
  Order,
  PaymentMethod,
  PaymentStatus,
  Transaction,
  PaymentCondition,
  PaymentType,
} from '@friday/core';

import {
  distinctUntilChanged,
  Subscription,
  Observable,
  startWith,
  map,
} from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss'],
  standalone: false,
})
export class TransactionFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  data?: Transaction | null;

  @Input()
  compact = false;

  @Input()
  formGroup: FormGroup<any> | null = null;

  @Output()
  save = new EventEmitter<Transaction>();

  @Output()
  cancel = new EventEmitter<void>();

  isPayment = false;
  showClientAndOrder = false;

  statusOptions = [
    { label: 'Em aberto', value: PaymentStatus.Pending },
    { label: 'Pago', value: PaymentStatus.Approved },
    { label: 'Atrasado', value: PaymentStatus.Delayed },
  ];

  typeOptions = [
    { label: 'Cliente', value: PaymentType.Incoming },
    { label: 'Fornecedor', value: PaymentType.Outgoing },
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

  private conditionSub?: Subscription;
  private typeSub?: Subscription;
  private paymentsSub?: Subscription;
  private statusSubscription?: Subscription;

  businessPartners$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
    private businessPartnerService: BusinessPartnerService,
    private modalService: ModalService,
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.formGroup) {
      this.form = this.formGroup;
    } else {
      this.initForm();
    }

    this.patchFormWithData();
    this.onTypeChanges();
    this.setupAutoComplete();

    this.setupStatusWatcher();

    // Subscription para price
    this.form.get('price')?.valueChanges.subscribe((price: number) => {
      const payments = this.form.get('totalOfPayments')?.value || 1;
      const validPayments = payments > 0 ? payments : 1;
      const perPayment = price / validPayments;
      this.form.get('paymentTotalPrice')?.setValue(perPayment);
      this.form
        .get('paymentTotalPriceFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(perPayment));
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

  ngOnDestroy(): void {
    if (this.conditionSub) {
      this.conditionSub.unsubscribe();
    }
    if (this.typeSub) {
      this.typeSub.unsubscribe();
    }
    if (this.paymentsSub) {
      this.paymentsSub.unsubscribe();
    }
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
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

  async onClientBlur(): Promise<void> {
    setTimeout(() => {
      const businessPartnerValue = this.form.get('businessPartnerName')!.value;
      const businessPartnerName =
        typeof businessPartnerValue === 'string'
          ? businessPartnerValue.trim()
          : '';
      if (!businessPartnerName) {
        this.markAsTouched('businessPartnerName');
        this.form.get('businessPartnerName')!.setErrors({ required: true });
        // Clear orderId/orderNumber only if the value is a string (manual edit)
        this.form.get('orderId')!.setValue(null);
        this.form.get('orderNumber')!.setValue('');
        return;
      }
      // Check if the name exists in the client list
      const clients = (this.businessPartners$ as any).source
        .value as BusinessPartner[];
      const found = clients.find((c) => c.name === businessPartnerName);
      if (found) {
        this.form.get('businessPartnerId')!.setValue(found.id);
        this.form.get('businessPartnerName')!.setValue(found.name);
        // Do not clear orderId/orderNumber when selecting via autocomplete
      } else {
        const confirmRef = this.modalService.showConfirmation({
          title: 'Cliente não encontrado',
          message: `O cliente "${businessPartnerName}" não existe. Deseja adicioná-lo?`,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Sim',
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
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
            clientFormRef
              .afterClosed()
              .subscribe((result: BusinessPartner | undefined) => {
                if (result) {
                  this.businessPartnerService.addOrUpdateBusinessPartner(
                    result,
                  );
                  this.form.get('businessPartnerName')!.setValue(result.name);
                  this.form.get('businessPartnerId')!.setValue(result.id);
                } else {
                  this.form.get('businessPartnerName')!.setValue('');
                  this.markAsTouched('businessPartnerName');
                  this.form
                    .get('businessPartnerName')!
                    .setErrors({ required: true });
                  this.form.get('businessPartnerId')!.setValue(null);
                  // Clear orderId/orderNumber when canceling manual registration
                  this.form.get('orderId')!.setValue(null);
                  this.form.get('orderNumber')!.setValue('');
                }
              });
          } else {
            this.form.get('businessPartnerName')!.setValue('');
            this.markAsTouched('businessPartnerName');
            this.form.get('businessPartnerName')!.setErrors({ required: true });
            this.form.get('businessPartnerId')!.setValue(null);
            // Clear orderId/orderNumber when canceling manually
            this.form.get('orderId')!.setValue(null);
            this.form.get('orderNumber')!.setValue('');
          }
        });
      }
    }, 200);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.getRawValue());
  }

  doCancel(): void {
    this.cancel.emit();
  }

  private initForm(): void {
    const required = Validators.required;
    const commonControls = {
      type: ['Incoming', this.isEdit ? [] : required],
      method: [PaymentMethod.Cash, this.isEdit ? [] : required],
      status: [
        {
          value: PaymentStatus.Pending,
          disabled: !this.data?.hasOpenedPayments && this.isEdit,
        },
      ],
      date: [new Date(), required],
      category: ['', this.isEdit ? [] : required],
      description: ['', required],
      condition: [PaymentCondition.FullPayment, this.isEdit ? [] : required],
      totalOfPayments: [0, [Validators.min(0)]],
      paymentTotalPrice: [0, [Validators.min(0)]],
      paymentTotalPriceFormatted: [{ value: 0, disabled: this.isEdit }],
      totalOfExpenses: [0, [Validators.min(0)]],
      expenseTotalPrice: [0, [Validators.min(0)]],
      expenseTotalPriceFormatted: [{ value: 0, disabled: this.isEdit }],
      businessPartnerId: [null],
      businessPartnerName: [''],
      orderId: [null],
      orderNumber: [{ value: '', disabled: true }],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    // Disable fields when isEdit is true
    if (this.isEdit && this.form) {
      this.form.get('businessPartnerName')?.disable();
      this.form.get('totalOfPayments')?.disable();
      this.form.get('totalOfExpenses')?.disable();
      this.form.get('type')?.disable();
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      // Fill fields as requested
      const totalOfPayments = this.data?.totalOfPayments || 1;
      const paymentTotalPrice = this.data.paymentTotalPrice || 0;
      const totalOfExpenses = this.data?.totalOfExpenses || 0;
      const expenseTotalPrice = this.data.expenseTotalPrice || 0;

      this.form.patchValue({
        ...this.data,
        totalOfPayments,
        paymentTotalPrice,
        paymentTotalPriceFormatted:
          this.currencyService.formatCurrencyBRL(paymentTotalPrice),
        totalOfExpenses,
        expenseTotalPrice,
        expenseTotalPriceFormatted:
          this.currencyService.formatCurrencyBRL(expenseTotalPrice),
      });

      // Disable price field
      this.form.get('paymentTotalPrice')?.disable();
      this.form.get('expenseTotalPrice')?.disable();
    } else {
      this.form
        .get('paymentTotalPriceFormatted')
        ?.setValue(
          this.currencyService.formatCurrencyBRL(this.data?.paymentTotalPrice),
        );
      this.form
        .get('expenseTotalPriceFormatted')
        ?.setValue(
          this.currencyService.formatCurrencyBRL(this.data?.expenseTotalPrice),
        );
    }
  }

  private setupAutoComplete(): void {
    if (this.compact) {
      return;
    }

    this.businessPartnerNameAutoComplete();
  }

  private businessPartnerNameAutoComplete() {
    this.businessPartners$ =
      this.form.get('type')?.value == 'Incoming'
        ? this.businessPartnerService.getClients(true)
        : this.businessPartnerService.getSuppliers(true);

    this.filteredBusinessPartners$ = this.form
      .get('businessPartnerName')!
      .valueChanges.pipe(
        startWith(''),
        map((value: string | BusinessPartner) => {
          let filterValue = '';
          if (typeof value === 'string') {
            filterValue = value.toLowerCase();
          } else if (value && typeof value === 'object') {
            filterValue = value.name?.toLowerCase() || '';
          }
          if (!filterValue) {
            return [];
          }
          return (this.businessPartners$ as any).source.value.filter(
            (businessPartner: BusinessPartner) =>
              (businessPartner.name || '').toLowerCase().includes(filterValue),
          );
        }),
      );
  }

  onTypeChanges(): void {
    const typeCtrl = this.form?.get('type');
    const businessPartnerNameCtrl = this.form?.get('businessPartnerName');
    if (typeCtrl && businessPartnerNameCtrl) {
      this.typeSub = typeCtrl.valueChanges.subscribe((val) => {
        this.showClientAndOrder = val === PaymentType.Incoming;
        if (val === PaymentType.Incoming) {
          businessPartnerNameCtrl.setValidators([Validators.required]);
        } else {
          businessPartnerNameCtrl.clearValidators();
        }
        businessPartnerNameCtrl.updateValueAndValidity();
      });
      // Initialize value when creating the form
      this.showClientAndOrder = typeCtrl.value === PaymentType.Incoming;
      if (typeCtrl.value === PaymentType.Incoming) {
        businessPartnerNameCtrl.setValidators([Validators.required]);
      } else {
        businessPartnerNameCtrl.clearValidators();
      }
      businessPartnerNameCtrl.updateValueAndValidity();
    }
    this.setupAutoComplete();
  }

  // Adiciona watcher para status igual ao order-form
  private setupStatusWatcher(): void {
    if (!this.isEdit || !this.form) {
      return;
    }
    // Remove previous subscription if any
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    // Add the field to the form if it does not exist
    if (!this.form.contains('markAllPaymentsAsApproved')) {
      this.form.addControl(
        'markAllPaymentsAsApproved',
        this.formBuilder.control(false),
      );
    }
    this.statusSubscription = this.form
      .get('status')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(async (newStatus: PaymentStatus) => {
        // Checa se há pagamentos abertos no momento da mudança de status
        const hasOpenedPayments =
          this.data && (this.data as any).hasOpenedPayments;
        if (newStatus === PaymentStatus.Approved && hasOpenedPayments) {
          const confirmed = await this.modalService
            .showConfirmation({
              title: 'Fechar pagamento',
              message: 'Deseja marcar todos os pagamentos como aprovados?',
              confirmButtonText: 'Sim',
              cancelButtonText: 'Não',
            })
            .afterClosed()
            .toPromise();

          if (!confirmed) {
            this.form.get('status')?.setValue(this.data?.status || '');
          }
          this.form.get('markAllPaymentsAsApproved')?.setValue(!!confirmed);
          if (this.data) {
            (this.data as any).markAllPaymentsAsApproved = !!confirmed;
          }
        } else {
          this.form.get('markAllPaymentsAsApproved')?.setValue(false);
          if (this.data) (this.data as any).markAllPaymentsAsApproved = false;
        }
      });
  }
}
