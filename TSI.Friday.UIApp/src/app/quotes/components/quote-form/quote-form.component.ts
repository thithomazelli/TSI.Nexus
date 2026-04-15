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
  Quote,
  QuoteStatus,
  FormBaseComponent,
  ModalService,
  CurrencyService,
  WebApiResponse,
  ApiType,
  ResponseStatus,
  NotificationService,
  QuoteService,
  QuoteProductService,
  PaymentCondition,
  PaymentMethod,
} from '@friday/core';

import { MatDialogRef } from '@angular/material/dialog';

import { Observable, startWith, map } from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { QuoteProductDetailsModalComponent } from '../../../quote-products/components/quote-product-details-modal/quote-product-details-modal.component';
import { QuoteDetailsModalComponent } from '../quote-details-modal/quote-details-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quote-form',
  templateUrl: './quote-form.component.html',
  styleUrl: './quote-form.component.scss',
  standalone: false,
})
export class QuoteFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Quote | null = <Quote>{
    quoteProducts: [],
  };

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<QuoteDetailsModalComponent>;

  businessPartners$!: Observable<WebApiResponse<BusinessPartner[]>>;
  businessPartnersArray$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  quoteStatusOptions = [
    { value: QuoteStatus.Open, label: 'Em Aberto' },
    { value: QuoteStatus.Canceled, label: 'Cancelado' },
    { value: QuoteStatus.Converted, label: 'Convertido' },
    { value: QuoteStatus.Expired, label: 'Expirado' },
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

  private _subscriptions: Subscription[] = [];
  private _baseEndPoint = ApiType.Quotes;

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private quoteService: QuoteService,
    private quoteProductService: QuoteProductService,
    private routerService: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.disableEditFields();
    this.patchFormWithData();
    this.setupAutoComplete();
    this.totalPriceChange();
    this.setupPaymentPriceWatcher();

    this._subscriptions.push(
      this.quoteProductService.quoteProductAdded$.subscribe((quoteProduct) => {
        if (quoteProduct) {
          this.data?.quoteProducts?.push(quoteProduct);
          this.updatePriceFields();
          this.updateTotalPriceFields();
          this.modalService.showNotification(
            true,
            '',
            'Produto adicionado ao orçamento com sucesso.',
          );
        }
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.form) {
      this.patchFormWithData();
    }
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  submit(): Observable<WebApiResponse<Quote> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const formValue = this.form.getRawValue();

    Object.assign(this.data!, formValue);

    if (this.data == null) {
      return of(null);
    }

    return this.save(this.data).pipe(
      tap({
        next: (response: WebApiResponse<Quote>) => {
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

  async onClientBlur(): Promise<void> {
    setTimeout(() => {
      const businessPartnerName = this.form
        .get('businessPartnerName')!
        .value?.trim();
      if (!businessPartnerName) {
        this.cleanClientSelection();
        return;
      }
      const sub = this.businessPartnersArray$.subscribe((clients) => {
        const found = clients.find((c) => c.name === businessPartnerName);
        if (!found) {
          const confirmRef = this.modalService.showConfirmation({
            title: 'Cliente não encontrado',
            message: `O cliente "${businessPartnerName}" não existe. Deseja adicioná-lo?`,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim',
          });
          const confirmSub = confirmRef
            .afterClosed()
            .subscribe((confirmed: boolean) => {
              if (confirmed) {
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

  removeProduct(index: number): void {
    if (!this.data?.quoteProducts) {
      return;
    }
    this.data.quoteProducts.splice(index, 1);
    this.updatePriceFields();
    this.updateTotalPriceFields();
  }

  openQuoteProductsModal() {
    const data = { ...this.data, ...this.form.getRawValue() };

    const initialState = {
      isEdit: false,
      id: null,
      parentId: null,
      parentData: data,
    };

    this.modalService.showTemplateModal(
      QuoteProductDetailsModalComponent,
      initialState,
    );
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      orderNumber: [''],
      businessPartnerId: [null, Validators.required],
      businessPartnerName: [
        { value: '', disabled: this.data?.businessPartnerId != null },
        Validators.required,
      ],
      description: [''],
      date: [new Date(), Validators.required],
      status: [QuoteStatus.Open, Validators.required],
      price: [{ value: 0, disabled: true }],
      priceFormatted: [{ value: 0, disabled: true }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      totalPriceFormatted: [{ value: 0, disabled: true }],
      condition: [PaymentCondition.FullPayment],
      method: [PaymentMethod.Cash],
      totalOfPayments: [0, [Validators.min(0)]],
      paymentTotalPrice: [0, [Validators.min(0)]],
      paymentTotalPriceFormatted: [{ value: 0, disabled: this.isEdit }],
      totalOfExpenses: [0, [Validators.min(0)]],
      expenseTotalPrice: [0, [Validators.min(0)]],
      expenseTotalPriceFormatted: [{ value: 0, disabled: this.isEdit }],
    });

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

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const totalOfPayments = this.data.totalOfPayments || 0;
      const paymentTotalPrice = this.data.paymentTotalPrice || 0;
      const totalOfExpenses = this.data.totalOfExpenses || 0;
      const expenseTotalPrice = this.data.expenseTotalPrice || 0;

      const patch = {
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
        totalPriceFormatted: this.currencyService.formatCurrencyBRL(
          this.data.totalPrice,
        ),
        totalOfPayments,
        paymentTotalPrice,
        paymentTotalPriceFormatted:
          this.currencyService.formatCurrencyBRL(paymentTotalPrice),
        totalOfExpenses,
        expenseTotalPrice,
        expenseTotalPriceFormatted:
          this.currencyService.formatCurrencyBRL(expenseTotalPrice),
      };

      this.form.patchValue(patch);

      this.form.get('paymentTotalPrice')?.disable();
      this.form.get('expenseTotalPrice')?.disable();
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

  onCurrencyBlur(formControlName: string): void {
    const priceControl = this.form.get(`${formControlName}Formatted`);
    if (!priceControl) {
      return;
    }

    const value = this.currencyService.parseCurrencyBRL(priceControl.value);
    priceControl.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get(formControlName)?.setValue(value);
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('businessPartnerName')?.disable();
      this.form.get('orderNumber')?.disable();
      this.form.get('totalOfPayments')?.disable();
      this.form.get('totalOfExpenses')?.disable();
    }
  }

  private setupPaymentPriceWatcher(): void {
    this._subscriptions.push(
      this.form
        .get('totalPrice')!
        .valueChanges.subscribe((totalPrice: number) => {
          const payments = this.form.get('totalOfPayments')?.value || 1;
          const validPayments = payments > 0 ? payments : 1;
          const perPayment = totalPrice / validPayments;
          this.form.get('paymentTotalPrice')?.setValue(perPayment);
          this.form
            .get('paymentTotalPriceFormatted')
            ?.setValue(this.currencyService.formatCurrencyBRL(perPayment));
        }),
    );
  }

  private totalPriceChange(): void {
    this.form
      .get('discount')
      ?.valueChanges.subscribe(() => this.updateTotalPriceFields());
  }

  private updatePriceFields(): void {
    const total = this.data?.quoteProducts?.reduce(
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
  }

  private save(quote: Quote): Observable<WebApiResponse<Quote>> {
    return this.isEdit && this.data
      ? this.quoteService.update(quote)
      : this.quoteService.add(quote);
  }

  private saveModal(response: WebApiResponse<Quote>): void {
    this.dialogRef?.close(response);
    this.modalService.showNotification(
      response.status == ResponseStatus.Success,
      'Orçamento adicionado',
      response.message,
    );
  }

  private savePage(response: WebApiResponse<Quote>): void {
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
