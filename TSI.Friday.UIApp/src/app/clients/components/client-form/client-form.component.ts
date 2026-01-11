import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { Company, FormBaseComponent, Individual } from '@friday/core';
// import { Client } from 'CAMINHO_DO_CLIENT_MODEL'; // Ajuste o import conforme seu projeto

@Component({
  selector: 'app-client-form',
  standalone: false,
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @ViewChild('firstInput') firstInput!: ElementRef;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 0);
  }
  @Input()
  isEdit = false;

  @Input()
  data?: Individual | Company | null; // Troque 'any' por 'Client' se tiver o model

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  @Output()
  save = new EventEmitter<any>(); // Troque 'any' por 'Client' se tiver o model

  @Output()
  cancel = new EventEmitter<void>();

  constructor(private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.disableEditFields();
    this.patchFormWithData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['data'] && !changes['data'].firstChange) ||
      (changes['isEdit'] && !changes['isEdit'].firstChange)
    ) {
      this.initForm();
      this.disableEditFields();
      this.patchFormWithData();
    }
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('type')?.disable();
      this.form.get('socialSecurityCard')?.disable();
      this.form.get('nationalRegistry')?.disable();
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const patch = { ...this.data };
      if ('birthday' in patch && patch.birthday) {
        const date = new Date((patch as any).birthday);
        if (!isNaN(date.getTime())) {
          (patch as any).birthday = date.toISOString().slice(0, 10);
        }
      }
      this.form.patchValue(patch);
    }
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
      name: ['', [Validators.required]],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^([\w!#$%&'*+\-/=?^`{|}~]+\.)*[\w!#$%&'*+\-/=?^`{|}~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/
          ),
        ],
      ],
      type: ['Física', [Validators.required]],
      phone: ['', []],
      mobile: ['', []],
      socialSecurityCard: ['', this.cpfValidator()],
      nationalRegistry: ['', this.cnpjValidator()],
      birthday: [''],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group({
          ...commonControls,
        })
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    this.form.get('type')?.valueChanges.subscribe((type) => {
      this.updateFieldValidators(type, true);
    });
    // Inicializa validações corretas para o tipo atual
    this.updateFieldValidators(this.form.get('type')?.value, false);
  }

  private updateFieldValidators(type: string, clearBirthday: boolean): void {
    if (type === 'Física') {
      this.form
        .get('socialSecurityCard')
        ?.setValidators([Validators.required, this.cpfValidator()]);
      this.form.get('nationalRegistry')?.clearValidators();
      this.form.get('nationalRegistry')?.setValue('');
      this.form.get('birthday')?.setValidators([Validators.required]);
    } else if (type === 'Jurídica') {
      this.form
        .get('nationalRegistry')
        ?.setValidators([Validators.required, this.cnpjValidator()]);
      this.form.get('socialSecurityCard')?.clearValidators();
      this.form.get('socialSecurityCard')?.setValue('');
      this.form.get('birthday')?.clearValidators();
      if (clearBirthday) {
        this.form.get('birthday')?.setValue('');
      }
    }
    this.form.get('socialSecurityCard')?.updateValueAndValidity();
    this.form.get('nationalRegistry')?.updateValueAndValidity();
    this.form.get('birthday')?.updateValueAndValidity();
  }

  // Validador customizado para CPF
  private cpfValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = (control.value || '').replace(/\D/g, '');
      if (!value) return null;
      if (value.length !== 11) return { cpfInvalido: true };
      let sum = 0;
      let remainder;
      if (/^(\d)\1+$/.test(value)) return { cpfInvalido: true };
      for (let i = 1; i <= 9; i++)
        sum += parseInt(value.charAt(i - 1)) * (11 - i);
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(value.charAt(9))) return { cpfInvalido: true };
      sum = 0;
      for (let i = 1; i <= 10; i++)
        sum += parseInt(value.charAt(i - 1)) * (12 - i);
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(value.charAt(10)))
        return { cpfInvalido: true };
      return null;
    };
  }

  // Validador customizado para CNPJ
  private cnpjValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = (control.value || '').replace(/\D/g, '');
      if (!value) return null;
      if (value.length !== 14) return { cnpjInvalido: true };
      if (/^(\d)\1+$/.test(value)) return { cnpjInvalido: true };
      let length = value.length - 2;
      let numbers = value.substring(0, length);
      let digits = value.substring(length);
      let sum = 0;
      let pos = length - 7;
      for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(0))) return { cnpjInvalido: true };
      length = length + 1;
      numbers = value.substring(0, length);
      sum = 0;
      pos = length - 7;
      for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(1))) return { cnpjInvalido: true };
      return null;
    };
  }
}
