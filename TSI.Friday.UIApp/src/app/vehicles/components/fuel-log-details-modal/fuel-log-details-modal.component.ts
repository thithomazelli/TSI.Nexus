import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatAutocompleteTrigger, MatAutocomplete, MatOption } from '@angular/material/autocomplete';
import { Observable, Subscription, combineLatestWith, map, startWith } from 'rxjs';
import {
  FuelLog,
  ModalService,
  NotificationService,
  Product,
  ProductService,
  ResponseStatus,
  SelectableOption,
  SelectableOptionGroup,
  SelectableOptionService,
  TranslationService,
  WebApiResponse,
  FuelLogService,
} from '@friday/core';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { CurrencyFieldComponent } from '../../../shared/components/currency-field/currency-field.component';
import { ProductDetailsModalComponent } from '../../../products/components/product-details-modal/product-details-modal.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-fuel-log-details-modal',
    templateUrl: './fuel-log-details-modal.component.html',
    styleUrl: './fuel-log-details-modal.component.scss',
    imports: [
        ReactiveFormsModule,
        NgFor,
        AsyncPipe,
        MatAutocompleteTrigger,
        MatAutocomplete,
        MatOption,
        DateFieldComponent,
        CurrencyFieldComponent,
        TranslatePipe,
    ],
})
export class FuelLogDetailsModalComponent implements OnInit, OnDestroy {
  saving = false;
  isEdit: boolean;
  vehicleId: string;
  statusOptions: SelectableOption[] = [];
  filteredProductsSku$!: Observable<Product[]>;
  filteredProductsName$!: Observable<Product[]>;

  private _id: string;
  private _products: Product[] = [];
  private _subscriptions: Subscription[] = [];
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<FuelLogDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private fuelLogService: FuelLogService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private productService: ProductService,
    private selectableOptionService: SelectableOptionService,
    private translationService: TranslationService,
  ) {
    const existing: FuelLog | null = dialogData?.data ?? null;
    this.vehicleId = dialogData?.vehicleId ?? '';
    this.isEdit = !!existing?.id;
    this._id = existing?.id ?? '';

    this.form = this.formBuilder.group({
      date: [existing?.date ?? '', Validators.required],
      odometer: [existing?.odometer ?? 0, [Validators.required, Validators.min(0)]],
      liters: [existing?.liters ?? 0, [Validators.required, Validators.min(0)]],
      pricePerLiter: [
        existing?.pricePerLiter ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      gasStation: [existing?.gasStation ?? ''],
      status: [existing?.status ?? '', Validators.required],
      productId: [existing?.productId ?? (null as string | null)],
      productSku: [existing?.productSku ?? ''],
      productName: [existing?.productName ?? ''],
    });
  }

  ngOnInit(): void {
    this.loadStatusOptions();
    this.setupAutoComplete();
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  close(): void {
    this.dialogRef.close(null);
  }

  async onProductSkuBlur(): Promise<void> {
    setTimeout(() => {
      const productSku = this.form.get('productSku')!.value?.trim();
      if (!productSku) {
        this.cleanProductSelection();
        return;
      }
      const found = this._products.find((p) => p.sku === productSku);
      if (found) {
        this.selectProduct(found);
        return;
      }
      this.confirmAndCreateProduct({ sku: productSku });
    }, 200);
  }

  async onProductNameBlur(): Promise<void> {
    setTimeout(() => {
      const productName = this.form.get('productName')!.value?.trim();
      if (!productName) {
        this.cleanProductSelection();
        return;
      }
      const found = this._products.find((p) => p.name === productName);
      if (found) {
        this.selectProduct(found);
        return;
      }
      this.confirmAndCreateProduct({ name: productName });
    }, 200);
  }

  selectProduct(product: Product): void {
    if (!product) {
      return;
    }

    this.form.patchValue({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const fuelLog = {
      // O backend não converte "" para Guid, então o id só entra no payload ao editar.
      ...(this.isEdit ? { id: this._id } : {}),
      date: this.toDate(raw.date),
      odometer: raw.odometer,
      liters: raw.liters,
      pricePerLiter: raw.pricePerLiter,
      totalCost: raw.liters * raw.pricePerLiter,
      gasStation: raw.gasStation,
      status: raw.status,
      vehicleId: this.vehicleId,
      productId: raw.productId || null,
      productSku: raw.productId ? raw.productSku : null,
      productName: raw.productId ? raw.productName : null,
    } as FuelLog;

    this.saving = true;
    const request = this.isEdit
      ? this.fuelLogService.update(fuelLog)
      : this.fuelLogService.add(fuelLog);

    request.subscribe({
      next: (response) => {
        this.saving = false;
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.dialogRef.close(response);
        }
      },
      error: () => {
        this.saving = false;
        this.notificationService.showMessage(
          ResponseStatus.Error,
          'Erro ao salvar o abastecimento.',
        );
      },
    });
  }

  private confirmAndCreateProduct(data: { sku?: string; name?: string }): void {
    const nameOrSku = data.sku ?? data.name ?? '';
    const confirmRef = this.modalService.showConfirmation({
      title: this.translationService.instant('COMMON.ENTITY_NOT_FOUND', { entity: this.translationService.instant('PRODUCTS.SINGULAR') }),
      message: this.translationService.instant('COMMON.CONFIRM_ADD_ENTITY', { entityLower: this.translationService.instant('PRODUCTS.SINGULAR').toLowerCase(), name: nameOrSku }),
      cancelButtonText: this.translationService.instant('COMMON.CANCEL'),
      confirmButtonText: this.translationService.instant('COMMON.YES'),
    });
    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        this.cleanProductSelection();
        return;
      }
      const productFormRef: MatDialogRef<any> = this.modalService.showTemplateModal(
        ProductDetailsModalComponent,
        { data, disableClose: true },
      );
      productFormRef
        .afterClosed()
        .subscribe((result: WebApiResponse<Product> | undefined) => {
          if (result) {
            this._products.push(result.data);
            this.selectProduct(result.data);
          } else {
            this.cleanProductSelection();
          }
        });
    });
  }

  private cleanProductSelection(): void {
    this.form.patchValue({ productId: null, productSku: '', productName: '' });
  }

  private loadStatusOptions(): void {
    this.selectableOptionService
      .getByGroup(SelectableOptionGroup.FuelLogStatus)
      .subscribe((response) => {
        this.statusOptions = response.data ?? [];
      });
  }

  private setupAutoComplete(): void {
    const productsArray$ = this.productService.getAll().pipe(
      map((response) => response.data ?? []),
    );

    this._subscriptions.push(
      productsArray$.subscribe((products) => (this._products = products)),
    );

    this.filteredProductsSku$ = this.form.get('productSku')!.valueChanges.pipe(
      startWith(''),
      combineLatestWith(productsArray$),
      map(([value, products]) => {
        const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
        if (!filterValue) {
          return [];
        }
        return products.filter((product: Product) =>
          (product.sku || '').toLowerCase().includes(filterValue),
        );
      }),
    );

    this.filteredProductsName$ = this.form.get('productName')!.valueChanges.pipe(
      startWith(''),
      combineLatestWith(productsArray$),
      map(([value, products]) => {
        const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
        if (!filterValue) {
          return [];
        }
        return products.filter((product: Product) =>
          (product.name || '').toLowerCase().includes(filterValue),
        );
      }),
    );
  }

  /**
   * app-date-field yields a "DD/MM/YYYY" string when typed manually, a Moment/Date instance when
   * picked from the calendar, or the original ISO string/Date when left untouched during edit.
   */
  private toDate(dateOnly: any): Date {
    if (!dateOnly) {
      return new Date();
    }
    if (typeof dateOnly === 'object' && typeof dateOnly.toDate === 'function') {
      return dateOnly.toDate();
    }
    if (dateOnly instanceof Date) {
      return dateOnly;
    }
    const str = String(dateOnly);
    if (str.includes('/')) {
      const [day, month, year] = str.split('/').map((part) => Number(part));
      return new Date(year, (month || 1) - 1, day || 1);
    }
    return new Date(str);
  }
}
