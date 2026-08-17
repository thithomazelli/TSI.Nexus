import {
  Component,
  Input,
  OnInit,
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
  Trip,
  PaymentMethod,
  PaymentStatus,
  Transaction,
  PaymentCondition,
  PaymentType,
  WebApiResponse,
  ApiType,
  NotificationService,
  TransactionService,
  ResponseStatus,
} from '@friday/core';

import {
  distinctUntilChanged,
  Subscription,
  Observable,
  startWith,
  map,
  of,
  tap,
  combineLatestWith,
} from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { TransactionDetailsModalComponent } from '../transaction-details-modal/transaction-details-modal.component';
import { Router } from '@angular/router';

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
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Transaction | null;

  @Input()
  parentData?: Order | Trip | null;

  @Input()
  compact = false;

  @Input()
  formGroup: FormGroup<any> | null = null;

  @Input()
  dialogRef?: MatDialogRef<TransactionDetailsModalComponent>;

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

  private _subscriptions: Subscription[] = [];
  private _baseEndPoint = ApiType.Transactions;

  businessPartners$!: Observable<WebApiResponse<BusinessPartner[]>>;
  businessPartnersArray$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private routerService: Router,
    private transactionService: TransactionService,
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
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onTypeChanges(): void {
    const typeCtrl = this.form?.get('type');
    const businessPartnerNameCtrl = this.form?.get('businessPartnerName');
    if (typeCtrl && businessPartnerNameCtrl) {
      this._subscriptions.push(
        typeCtrl.valueChanges.subscribe((val) => {
          this.showClientAndOrder = val === PaymentType.Incoming;
          if (val === PaymentType.Incoming) {
            businessPartnerNameCtrl.setValidators([Validators.required]);
          } else {
            businessPartnerNameCtrl.clearValidators();
          }
          businessPartnerNameCtrl.updateValueAndValidity();
          this.resetBusinessPartnerSelection();
          this.setupAutoComplete();
        }),
      );
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

  submit(): Observable<WebApiResponse<Transaction> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();
    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    return this.save(rawValue as Transaction).pipe(
      tap({
        next: (response: WebApiResponse<Transaction>) => {
          if (this.isModal) {
            this.saveModal(response);
          } else {
            this.savePage(response);
          }
        },
        error: (err) => {
          this.notificationService.showMessage('Error', 'Erro ao salvar');
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
          this.transactionService
            .delete(this.data as Transaction)
            .pipe(
              tap({
                next: (response: WebApiResponse<Transaction>) => {
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
              TransactionDetailsModalComponent,
              initialState,
            );
          }
        }
      });
  }

  missingPayments(): boolean {
    return (
      (this.parentData?.totalPrice || 0) > (this.data?.paymentTotalPrice || 0)
    );
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
        this.cleanClientSelection();
        return;
      }
      const isClient = this.form.get('type')?.value === PaymentType.Incoming;
      const entityLabel = isClient ? 'Cliente' : 'Fornecedor';
      // Sempre checa a lista de clientes ou fornecedores, mesmo se businessPartnerId estiver vazio
      const sub = this.businessPartnersArray$.subscribe((businessPartners) => {
        const found = businessPartners.find(
          (c) => c.name === businessPartnerName,
        );
        if (!found) {
          const confirmRef = this.modalService.showConfirmation({
            title: `${entityLabel} não encontrado`,
            message: `O ${entityLabel.toLowerCase()} "${businessPartnerName}" não existe. Deseja adicioná-lo?`,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim',
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

  private resetBusinessPartnerSelection(clearValidation = false): void {
    this.form.get('businessPartnerId')!.setValue(null);
    this.form.get('businessPartnerName')!.setValue('');
    this.form.get('orderId')!.setValue(null);
    this.form.get('orderNumber')!.setValue('');
    if (clearValidation) {
      this.form.get('businessPartnerId')!.setErrors({ required: true });
      this.form.get('businessPartnerName')!.setErrors({ required: true });
      this.markAsTouched('businessPartnerId');
      this.markAsTouched('businessPartnerName');
    } else {
      this.form.get('businessPartnerId')!.setErrors(null);
      this.form.get('businessPartnerName')!.setErrors(null);
    }
  }

  private cleanClientSelection(): void {
    this.resetBusinessPartnerSelection(true);
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
    } else
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

  private getBusinessPartnersByType(
    type: PaymentType,
  ): Observable<WebApiResponse<BusinessPartner[]>> {
    return type === PaymentType.Incoming
      ? this.businessPartnerService.getClients()
      : this.businessPartnerService.getSuppliers();
  }

  private businessPartnerNameAutoComplete() {
    const type = this.form.get('type')?.value ?? PaymentType.Incoming;
    this.businessPartners$ = this.getBusinessPartnersByType(type);
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

  private setupStatusWatcher(): void {
    if (!this.isEdit || !this.form) {
      return;
    }

    // Add the field to the form if it does not exist
    if (!this.form.contains('markAllPaymentsAsApproved')) {
      this.form.addControl(
        'markAllPaymentsAsApproved',
        this.formBuilder.control(false),
      );
    }
    this._subscriptions.push(
      this.form
        .get('status')!
        .valueChanges.pipe(distinctUntilChanged())
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
        }),
    );
  }

  private save(
    transaction: Transaction,
  ): Observable<WebApiResponse<Transaction>> {
    return this.isEdit && this.data
      ? this.transactionService.update(transaction)
      : this.transactionService.add(transaction);
  }

  private saveModal(response: WebApiResponse<Transaction>): void {
    this.dialogRef?.close(response);
    this.modalService.showSweetNotification(
      '',
      response.message,
      response.status,
    );
  }

  private savePage(response: WebApiResponse<Transaction>): void {
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
