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
import { MatDialogRef } from '@angular/material/dialog';

import {
  Client,
  ClientService,
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

  clients$!: Observable<Client[]>;
  filteredClients$!: Observable<Client[]>;

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
    private clientService: ClientService,
    private orderService: OrderService,
    private modalService: ModalService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
    this.onConditionChanges();
    this.onTypeChanges();
    this.onInstallmentsChanges();
    this.setupAutoComplete();
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
      const clientName = this.form.get('clientName')!.value?.trim();
      if (!clientName) {
        this.markAsTouched('clientName');
        this.form.get('clientName')!.setErrors({ required: true });
        return;
      }
      // Verifica se o nome existe na lista de clientes
      const clients = (this.clients$ as any).source.value as Client[];
      const found = clients.find((c) => c.name === clientName);
      if (!found) {
        const confirmRef = this.modalService.showConfirmation({
          title: 'Cliente não encontrado',
          message: `O cliente "${clientName}" não existe. Deseja adicioná-lo?`,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Sim',
          confirmDelete: async () => {
            // Abrir modal de adicionar cliente
            const clientFormRef: MatDialogRef<any> =
              this.modalService.showTemplateModal(ClientDetailsModalComponent, {
                data: { name: clientName },
                width: '600px',
                disableClose: true,
              });
            clientFormRef
              .afterClosed()
              .subscribe((result: Client | undefined) => {
                if (result) {
                  this.clientService.addOrUpdateClient(result);
                  this.form.get('clientName')!.setValue(result.name);
                  this.form.get('clientId')!.setValue(result.id);
                } else {
                  this.form.get('clientName')!.setValue('');
                  this.markAsTouched('clientName');
                  this.form.get('clientName')!.setErrors({ required: true });
                }
              });
          },
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) {
            this.form.get('clientName')!.setValue('');
            this.markAsTouched('clientName');
            this.form.get('clientName')!.setErrors({ required: true });
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
      if (!found) {
        this.modalService.showNotification(
          false,
          'Pedido não encontrado',
          `O pedido "${orderNumber}" não existe. Por favor, selecione um pedido válido ou cadastre-o antes de associar a este pagamento.`,
        );
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
      type: ['', Validators.required],
      method: ['', Validators.required],
      status: ['', Validators.required],
      date: [new Date(), Validators.required],
      category: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: [{ value: 0 }],
      condition: ['', Validators.required],
      installments: [1, [Validators.min(1)]],
      pricePerInstallment: [0, [Validators.min(0)]],
      pricePerInstallmentFormatted: [{ value: 0, disabled: true }],
      clientId: [null],
      clientName: [''],
      orderId: [null],
      orderNumber: [''],
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
      this.form.patchValue({
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
        pricePerInstallmentFormatted: this.currencyService.formatCurrencyBRL(
          this.data.pricePerInstallment,
        ),
      });
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
    this.clientNameAutoComplete();
    this.orderNumberAutoComplete();
  }

  private clientNameAutoComplete() {
    this.clients$ = this.clientService.getClients();
    this.filteredClients$ = this.form.get('clientName')!.valueChanges.pipe(
      startWith(''),
      map((value: string | Client) => {
        let filterValue = '';
        if (typeof value === 'string') {
          filterValue = value.toLowerCase();
        } else if (value && typeof value === 'object') {
          filterValue = value.name?.toLowerCase() || '';
        }
        if (!filterValue) {
          return [];
        }
        return (this.clients$ as any).source.value.filter((client: Client) =>
          (client.name || '').toLowerCase().includes(filterValue),
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
    const clientNameCtrl = this.form?.get('clientName');
    if (typeCtrl && clientNameCtrl) {
      this.typeSub = typeCtrl.valueChanges.subscribe((val) => {
        this.showClientAndOrder = val === PaymentType.Incoming;
        if (val === PaymentType.Incoming) {
          clientNameCtrl.setValidators([Validators.required]);
        } else {
          clientNameCtrl.clearValidators();
        }
        clientNameCtrl.updateValueAndValidity();
      });
      // Inicializa o valor ao criar o form
      this.showClientAndOrder = typeCtrl.value === PaymentType.Incoming;
      if (typeCtrl.value === PaymentType.Incoming) {
        clientNameCtrl.setValidators([Validators.required]);
      } else {
        clientNameCtrl.clearValidators();
      }
      clientNameCtrl.updateValueAndValidity();
    }
  }

  private onConditionChanges(): void {
    const conditionCtrl = this.form?.get('condition');
    if (conditionCtrl) {
      this.conditionSub = conditionCtrl.valueChanges.subscribe((val) => {
        this.isInstallment = val === PaymentCondition.InInstallments;
      });
      // Inicializa o valor ao criar o form
      this.isInstallment =
        conditionCtrl.value === PaymentCondition.InInstallments;
    }
  }

  private onInstallmentsChanges(): void {
    const installmentsCtrl = this.form?.get('installments');
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
