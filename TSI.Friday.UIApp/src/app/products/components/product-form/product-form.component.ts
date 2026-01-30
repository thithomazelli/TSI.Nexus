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
  CurrencyService,
  FormBaseComponent,
  Product,
  ProductType,
  ProductUnit,
} from '@friday/core';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  standalone: false,
})
export class ProductFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  data?: Product | null;

  // controla estilo compacto quando usado em page
  @Input()
  compact = false;

  @Output()
  save = new EventEmitter<Product>();

  @Output()
  cancel = new EventEmitter<void>();

  unitOptions = [
    { label: 'Unit', value: ProductUnit.Unit },
    { label: 'Kilogram', value: ProductUnit.Kilogram },
    { label: 'Gram', value: ProductUnit.Gram },
  ];

  productTypeOptions = [
    { label: 'Sale', value: ProductType.Sale },
    { label: 'Rental', value: ProductType.Rental },
    { label: 'Service', value: ProductType.Service },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // quando data chegar depois do init, apenas patch no form
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }

    // se o modo de edição mudar depois, re-inicializa o form com o novo modo
    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      this.initForm();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value as Product);
  }

  doCancel(): void {
    this.cancel.emit();
  }

  onPriceBlur(): void {
    const priceControl = this.form.get('priceFormatted');
    if (!priceControl) {
      return;
    }

    const value = this.currencyService.parseCurrencyBRL(priceControl.value);
    priceControl.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get('price')?.setValue(value);
  }

  private initForm(): void {
    const commonControls = {
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      priceFormatted: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      type: ['', Validators.required],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
      photo: [''],
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
      const patch = {
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
      };
      this.form.patchValue(patch);
    }

    this.form.get('type')?.valueChanges.subscribe((type) => {
      const quantityControl = this.form.get('quantityInStock');
      if (type === ProductType.Service) {
        quantityControl?.setValue(0);
        quantityControl?.disable();
      } else {
        quantityControl?.enable();
      }
    });
  }
}
