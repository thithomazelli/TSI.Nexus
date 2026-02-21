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
  OrderService,
  Payment,
} from '@friday/core';
import { PaymentStatus } from '@friday/core';
import { PaymentType } from '@friday/core';
import { PaymentMethod } from '@friday/core';
import { PaymentCondition } from '@friday/core';
import { Subscription } from 'rxjs';

import { Observable, startWith, map } from 'rxjs';
import { ClientDetailsModalComponent } from '../../../clients/components/client-details-modal/client-details-modal.component';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
  standalone: false,
})
export class PaymentFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  data?: Payment | null;

  @Input()
  compact = false;

  @Input()
  formGroup: FormGroup<any> | null = null;

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

  private conditionSub?: Subscription;
  private typeSub?: Subscription;
  private installmentsSub?: Subscription;

  businessPartners$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
    private businessPartnerService: BusinessPartnerService,
    private orderService: OrderService,
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
    this.onConditionChanges();
    this.onTypeChanges();
    this.onInstallmentsChanges();
    this.setupAutoComplete();

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

  ngOnDestroy(): void {
    if (this.conditionSub) {
      this.conditionSub.unsubscribe();
    }
    if (this.typeSub) {
      this.typeSub.unsubscribe();
    }
    if (this.installmentsSub) {
      this.installmentsSub.unsubscribe();
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
      const businessPartnerName = this.form
        .get('businessPartnerName')!
        .value?.trim();
      if (!businessPartnerName) {
        this.markAsTouched('businessPartnerName');
        this.form.get('businessPartnerName')!.setErrors({ required: true });
        return;
      }
      // Verifica se o nome existe na lista de clientes
      const clients = (this.businessPartners$ as any).source
        .value as BusinessPartner[];
      const found = clients.find((c) => c.name === businessPartnerName);
      if (found) {
        this.form.get('businessPartnerId')!.setValue(found.id);
        this.form.get('businessPartnerName')!.setValue(found.name);
      } else {
        const confirmRef = this.modalService.showConfirmation({
          title: 'Cliente não encontrado',
          message: `O cliente "${businessPartnerName}" não existe. Deseja adicioná-lo?`,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Sim',
          confirmDelete: async () => {
            // Abrir modal de adicionar cliente
            const clientFormRef: MatDialogRef<any> =
              this.modalService.showTemplateModal(ClientDetailsModalComponent, {
                data: { name: businessPartnerName },
                width: '600px',
                disableClose: true,
              });
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
                }
              });
          },
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) {
            this.form.get('businessPartnerName')!.setValue('');
            this.markAsTouched('businessPartnerName');
            this.form.get('businessPartnerName')!.setErrors({ required: true });
            this.form.get('businessPartnerId')!.setValue(null);
          }
        });
      }
    }, 200);
  }

  async onOrderBlur(): Promise<void> {
    setTimeout(() => {
      const orderNumber = this.form.get('orderNumber')!.value?.trim();
      if (!orderNumber) {
        this.markAsTouched('orderNumber');
        this.form.get('orderNumber')!.setErrors({ required: true });
        return;
      }
      const orders = (this.orders$ as any).source.value as Order[];
      const found = orders.find((o) => o.orderNumber === orderNumber);
      if (found) {
        this.form.get('orderId')!.setValue(found.id);
        this.form.get('orderNumber')!.setValue(found.orderNumber);
      } else {
        this.modalService.showNotification(
          false,
          'Pedido não encontrado',
          `O pedido "${orderNumber}" não existe. Por favor, selecione um pedido válido ou cadastre-o antes de associar a este pagamento.`,
        );
        this.form.get('orderId')!.setValue(null);
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
    const commonControls = {
      type: [this.compact ? 'Incoming' : '', Validators.required],
      method: ['', Validators.required],
      status: ['', Validators.required],
      date: [new Date(), Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: [{ value: 0 }],
      condition: ['', Validators.required],
      totalOfInstallments: [1, [Validators.min(1)]],
      pricePerInstallment: [0, [Validators.min(0)]],
      pricePerInstallmentFormatted: [{ value: 0, disabled: true }],
      businessPartnerId: [null],
      businessPartnerName: [''],
      orderId: [null],
      orderNumber: [''],
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
      this.form.get('totalOfInstallments')?.disable();
      this.form.get('type')?.disable();
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      // Preenche campos conforme solicitado
      const totalOfInstallments = Array.isArray(this.data.installments)
        ? this.data.installments.length
        : 1;
      const priceSum = Array.isArray(this.data.installments)
        ? this.data.installments.reduce(
            (acc, curr) => acc + (curr.price || 0),
            0,
          )
        : this.data.price || 0;
      const pricePerInstallment =
        priceSum / (totalOfInstallments > 0 ? totalOfInstallments : 1);

      this.form.patchValue({
        ...this.data,
        totalOfInstallments,
        price: priceSum,
        pricePerInstallment,
        priceFormatted: this.currencyService.formatCurrencyBRL(priceSum),
        pricePerInstallmentFormatted:
          this.currencyService.formatCurrencyBRL(pricePerInstallment),
      });

      // Bloqueia campo preço
      this.form.get('price')?.disable();
    } else {
      this.form
        .get('priceFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(this.data?.price));
      this.form
        .get('pricePerInstallmentFormatted')
        ?.setValue(
          this.currencyService.formatCurrencyBRL(
            this.data?.pricePerInstallment,
          ),
        );
    }
  }

  private setupAutoComplete(): void {
    if (this.compact) {
      return;
    }

    this.businessPartnerNameAutoComplete();
    this.orderNumberAutoComplete();
  }

  private businessPartnerNameAutoComplete() {
    this.businessPartners$ = this.businessPartnerService.getClients();
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

  private orderNumberAutoComplete() {
    this.orders$ = this.orderService.getOrders();
    this.filteredOrders$ = this.form.get('orderNumber')!.valueChanges.pipe(
      startWith(''),
      map((value: string | Order) => {
        let filterValue = '';
        if (typeof value === 'string') {
          filterValue = value.toLowerCase();
        } else if (value && typeof value === 'object') {
          filterValue = value.orderNumber?.toLowerCase() || '';
        }
        if (!filterValue) {
          return [];
        }
        return (this.orders$ as any).source.value.filter((order: Order) =>
          (order.orderNumber || '').toLowerCase().includes(filterValue),
        );
      }),
    );
  }

  private onTypeChanges(): void {
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
      // Inicializa o valor ao criar o form
      this.showClientAndOrder = typeCtrl.value === PaymentType.Incoming;
      if (typeCtrl.value === PaymentType.Incoming) {
        businessPartnerNameCtrl.setValidators([Validators.required]);
      } else {
        businessPartnerNameCtrl.clearValidators();
      }
      businessPartnerNameCtrl.updateValueAndValidity();
    }
  }

  private onConditionChanges(): void {
    const conditionCtrl = this.form?.get('condition');
    if (conditionCtrl) {
      this.conditionSub = conditionCtrl.valueChanges.subscribe(
        (paymentCondition) => {
          this.isInstallment =
            paymentCondition === PaymentCondition.InInstallments;
          if (paymentCondition !== PaymentCondition.InInstallments) {
            const price = this.form.get('priceFormatted');
            this.form.get('totalOfInstallments')?.setValue(1);
            this.form.get('pricePerInstallment')?.setValue(price);
          }
        },
      );
      // Inicializa o valor ao criar o form
      this.isInstallment =
        conditionCtrl.value === PaymentCondition.InInstallments;
    }
  }

  private onInstallmentsChanges(): void {
    const installmentsCtrl = this.form?.get('totalOfInstallments');
    if (installmentsCtrl) {
      this.installmentsSub = installmentsCtrl.valueChanges.subscribe(
        (installments: number) => {
          const price = this.form.get('price')?.value || 0;
          const validInstallments = installments > 0 ? installments : 1;
          const perInstallment = price / validInstallments;
          this.form.get('pricePerInstallment')?.setValue(perInstallment);
          this.form
            .get('pricePerInstallmentFormatted')
            ?.setValue(this.currencyService.formatCurrencyBRL(perInstallment));
        },
      );

      // Inicializa o valor ao criar o form
      const initialInstallments =
        installmentsCtrl.value > 0 ? installmentsCtrl.value : 1;
      const price = this.form.get('price')?.value || 0;
      const perInstallment = price / initialInstallments;
      this.form.get('pricePerInstallment')?.setValue(perInstallment);
      this.form
        .get('pricePerInstallmentFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(perInstallment));
    }
  }
}
