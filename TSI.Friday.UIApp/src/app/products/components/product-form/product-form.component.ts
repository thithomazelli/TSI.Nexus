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
import { FormBaseComponent, Product, ProductUnit } from '@friday/core';

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

  constructor(private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
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

  private initForm(): void {
    const commonControls = {
      sku: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    // aplicar data se já existir (não resetar o form)
    if (this.data) {
      this.form.patchValue(this.data);
    }
  }
}
