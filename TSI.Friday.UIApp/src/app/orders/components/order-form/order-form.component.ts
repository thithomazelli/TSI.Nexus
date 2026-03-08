import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
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
  OrderProduct,
  TransactionType,
  TransactionCondition,
  PaymentMethod,
  PaymentStatus,
} from '@friday/core';

import { MatDialogRef } from '@angular/material/dialog';

import { Observable, startWith, map } from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { OrderProductsDetailsModalComponent } from '../../../order-products/components/order-product-details-modal/order-products-details-modal.component';

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
  @Output()
  save = new EventEmitter<Order>();

  @Output()
  cancel = new EventEmitter<void>();

  @ViewChild('firstInput')
  firstInput!: ElementRef;

  @Input()
  isEdit = false;

  @Input()
  data?: Order | null = <Order>{
    orderProducts: [],
  };

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  businessPartners$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  orderStatusOptions = [
    { value: OrderStatus.Open, label: 'Em Aberto' },
    { value: OrderStatus.Closed, label: 'Fechado' },
    { value: OrderStatus.WaitingPayment, label: 'Aguardando Pagamento' },
  ];

  private statusSubscription?: any;

  constructor(
    private formBuilder: FormBuilder,
    private businessPartnerService: BusinessPartnerService,
    private modalService: ModalService,
    private currencyService: CurrencyService,
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.form) {
      this.patchFormWithData();
      this.setupStatusWatcher();
    }
  }

  ngOnDestroy(): void {
    this.businessPartners$ = new Observable<BusinessPartner[]>();
    this.filteredBusinessPartners$ = new Observable<BusinessPartner[]>();
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  get transactionFormGroup(): FormGroup {
    return this.form.get('transaction') as FormGroup;
  }

  async onClientBlur(): Promise<void> {
    setTimeout(() => {
      const businessPartnerName = this.form
        .get('businessPartnerName')!
        .value?.trim();
      const businessPartnerId = this.form.get('businessPartnerId')!.value;
      if (!businessPartnerName || !businessPartnerId) {
        this.cleanClientSelection();
        return;
      }
      // Check if the name exists in the client list
      const clients = (this.businessPartners$ as any).source
        .value as BusinessPartner[];
      const found = clients.find((c) => c.name === businessPartnerName);
      if (!found) {
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
                  this.cleanClientSelection();
                }
              });
          } else {
            this.cleanClientSelection();
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

    // Ensure transactionGroup has the updated client fields
    const formValue = this.form.getRawValue();
    if (formValue.transaction) {
      formValue.transaction.businessPartnerId = formValue.businessPartnerId;
      formValue.transaction.businessPartnerName = formValue.businessPartnerName;
    }

    Object.assign(this.data!, formValue);

    if (this.data?.transaction?.id == null) {
      delete this.data!.transaction!.id;
    }

    // Ensure markAllOrderProductsAsReturned is sent
    if (formValue.markAllOrderProductsAsReturned !== undefined) {
      this.data!.markAllProductsAsReturned =
        formValue.markAllOrderProductsAsReturned;
    }

    this.save.emit(this.data!);
  }

  doCancel(): void {
    this.cancel.emit();
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
        'Please select a client before adding products.',
      );
      return;
    }

    const ref = this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe((orderProduct: OrderProduct) => {
        this.data?.orderProducts?.push(orderProduct);

        this.updatePriceFields();
        this.updateTotalPriceFields();
        this.modalService.showNotification(
          true,
          '',
          'Product added successfully',
        );
        ref.close();
      });
    }
  }

  private initForm(): void {
    const transactionGroup = this.formBuilder.group({
      id: [null],
      type: [TransactionType.Incoming],
      date: [new Date(), Validators.required],
      method: [PaymentMethod.Cash, Validators.required],
      status: [PaymentStatus.Pending, Validators.required],
      category: ['Recebimentos'],
      condition: [
        {
          value: TransactionCondition.FullPayment,
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
      price: [0, [Validators.min(0)]],
      pricePerInstallment: [0, [Validators.min(0)]],
      pricePerInstallmentFormatted: [{ value: 0, disabled: true }],
    });

    this.form = this.formBuilder.group({
      orderNumber: [''],
      businessPartnerId: [null],
      businessPartnerName: [
        { value: '', disabled: this.data?.businessPartnerId != null },
      ],
      description: [''],
      status: [OrderStatus.Open, Validators.required],
      price: [{ value: 0, disabled: true }],
      priceFormatted: [{ value: 0, disabled: true }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      totalPriceFormatted: [{ value: 0, disabled: true }],
      transaction: transactionGroup,
    });

    if (this.isEdit) {
      this.form.addControl('id', this.formBuilder.control(''));
    } else {
      if (this.data?.businessPartnerId != null) {
        return;
      }

      this.form.get('businessPartnerName')!.valueChanges.subscribe((name) => {
        const businessPartner = (
          this.businessPartners$ as any
        ).source.value.find(
          (c: BusinessPartner) => (c.name || c.name) === name,
        );
        if (businessPartner) {
          this.form.get('businessPartnerId')!.setValue(businessPartner.id);
        }
      });
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      // Ensure price and totalPrice are never undefined or null
      const patch = {
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
        totalPriceFormatted: this.currencyService.formatCurrencyBRL(
          this.data.totalPrice,
        ),
        transaction: {
          ...this.data.transaction,
          totalOfPayments: this.data.transaction?.totalOfPayments || 1,
          pricePerInstallmentFormatted: this.currencyService.formatCurrencyBRL(
            (this.data.totalPrice ?? 0) /
              (this.data.transaction?.totalOfPayments || 1),
          ),
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
    this.businessPartners$ = this.businessPartnerService.getClients(true);
    this.filteredBusinessPartners$ = this.form
      .get('businessPartnerName')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => {
          const filterValue = value?.toLowerCase() || '';
          if (!filterValue) {
            return [];
          }
          return (this.businessPartners$ as any).source.value.filter(
            (businessPartner: BusinessPartner) =>
              (businessPartner.name || businessPartner.name || '')
                .toLowerCase()
                .includes(filterValue),
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
      (sum, p) => sum + (p?.totalPrice || 0) * (p?.quantity || 0),
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

    const transactionGroup = this.transactionFormGroup;
    const transactions = transactionGroup?.get('totalOfPayments')?.value || 1;
    const pricePerInstallment = total / (transactions > 0 ? transactions : 1);

    transactionGroup.get('price')?.setValue(total);
    transactionGroup
      .get('pricePerInstallmentFormatted')
      ?.setValue(this.currencyService.formatCurrencyBRL(pricePerInstallment));
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
              title: 'Fechar pedido',
              message: 'Deseja marcar todos os produtos como retornados?',
              confirmButtonText: 'Sim',
              cancelButtonText: 'Não',
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
}
