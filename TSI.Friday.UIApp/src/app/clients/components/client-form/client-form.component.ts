import {
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
  FormGroup,
} from '@angular/forms';
import {
  Address,
  BusinessPartner,
  Company,
  FormBaseComponent,
  Individual,
} from '@friday/core';
// import { Client } from 'CAMINHO_DO_CLIENT_MODEL'; // Ajuste o import conforme seu projeto

@Component({
  selector: 'app-client-form',
  standalone: false,
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @ViewChild('firstInput') firstInput!: ElementRef;

  @Input()
  isEdit = false;

  @Input()
  data?: Individual | Company | null = <BusinessPartner>{};

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  @Output()
  save = new EventEmitter<any>(); // Troque 'any' por 'Client' se tiver o model

  @Output()
  cancel = new EventEmitter<void>();

  canDisplayClientButtons = true;
  canDisplayAddressForm = true;
  canDisplayAddressButtons = false;
  canDisplayNewAddressLink = false;
  selectedAddressIndex: number | null = null;

  constructor(private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.canDisplayAddressForm = this.isEdit ? false : true;
    this.canDisplayAddressButtons =
      this.isEdit && this.canDisplayAddressForm ? true : false;
    this.canDisplayNewAddressLink = this.isEdit ? false : true;

    this.initForm();
    this.initAddressInfo();
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

  get addressFormGroup(): FormGroup {
    return this.form.get('address') as FormGroup;
  }

  /**
   * Retorna o endereço selecionado de forma segura para o template
   */
  get selectedAddress(): Address | null {
    if (
      this.selectedAddressIndex !== null &&
      Array.isArray(this.data?.addresses) &&
      this.selectedAddressIndex >= 0 &&
      this.selectedAddressIndex < this.data.addresses.length
    ) {
      return this.data.addresses[this.selectedAddressIndex];
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (!raw.birthday || raw.birthday === '') {
      raw.birthday = null;
    }

    if (this.compact) {
      // Se vier address preenchido, mova para addresses
      if (raw.address && Object.keys(raw.address).some((k) => raw.address[k])) {
        if (!this.data!.addresses) {
          this.data!.addresses = [];
        }
        // Se address já existe em addresses (por id ou igualdade), substitui, senão adiciona
        const idx = this.data!.addresses.findIndex(
          (a) => a.id && raw.address.id && a.id === raw.address.id,
        );

        if (idx !== -1) {
          this.data!.addresses[idx] = raw.address;
        } else {
          this.data!.addresses.push(raw.address);
        }
      }

      // Atualiza as propriedades de data com os valores do formulário, exceto address
      const { address, ...rest } = raw;
      Object.assign(this.data!, rest);

      // Remove o atributo address do objeto final, se existir
      if ('address' in this.data!) {
        delete (this.data as any).address;
      }

      // Se não tiver endereço default, define o primeiro como default
      if (!this.data?.addresses.find((addr) => addr.isDefault)) {
        this.data!.addresses![0].isDefault = true;
      }

      this.data?.addresses.find((addr) => {
        if (addr.id == null) {
          delete addr.id;
        }
      });
    }

    this.save.emit(this.data);
  }

  doCancel(): void {
    this.cancel.emit();
  }

  onSaveAndAddNewAddress(): void {
    this.addressFormGroup.markAllAsTouched();
    if (this.addressFormGroup.valid) {
      this.saveAddress(this.addressFormGroup.value);
    }
  }

  displayNewAddress(): void {
    this.restoreAddressValidators();
    this.selectedAddressIndex = null;
    this.canDisplayAddressForm = true;
    this.canDisplayAddressButtons = true;
  }

  editAddress(addr: Address) {
    const idx = this.data?.addresses?.findIndex((a) => a === addr);
    if (idx !== undefined && idx !== -1) {
      this.selectedAddressIndex = idx;
      // Preenche o form de endereço com os dados selecionados
      this.addressFormGroup.patchValue({ ...addr });
      this.canDisplayAddressForm = true;
      this.canDisplayAddressButtons = true;
      this.canDisplayNewAddressLink = false;
    }
  }

  cancelAddress(): void {
    this.canDisplayClientButtons = true;
    this.canDisplayAddressForm = false;
    this.canDisplayAddressButtons = false;
    this.canDisplayNewAddressLink = false;
    this.selectedAddressIndex = null;

    this.resetAddressForm();
  }

  saveAddress(address: Address): void {
    if (!this.addressFormGroup.valid) {
      return;
    }

    if (this.selectedAddressIndex !== null && this.data?.addresses) {
      // Atualiza o endereço editado
      this.data.addresses[this.selectedAddressIndex] = address;
    } else {
      // Adiciona novo endereço
      this.data!.addresses.push(address);
    }

    this.initAddressInfo();
    this.resetAddressForm();

    this.selectedAddressIndex = null;
    this.canDisplayAddressForm = this.canDisplayNewAddressLink ? true : false;
    this.canDisplayAddressButtons = false;

    if (this.canDisplayAddressForm) {
      this.restoreAddressValidators();
    }
  }

  private initAddressInfo() {
    if (!this.data) {
      return;
    }

    if (!this.data.addresses) {
      this.data.addresses = [];
      return;
    }

    this.data.addresses = (this.data.addresses ?? []).map(
      (addr) => new Address({ ...addr }),
    );
  }

  private initForm(): void {
    const addressGroup = this.formBuilder.group({
      id: [null],
      name: ['', Validators.required],
      type: [null, Validators.required],
      zipCode: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      street: ['', Validators.required],
      number: [null, Validators.required],
      comments: [''],
      businessPartnerId: [null],
      country: ['BR', Validators.required],
      isDefault: [false],
    });

    const commonControls = {
      name: ['', [Validators.required]],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^([\w!#$%&'*+\-/=?^`{|}~]+\.)*[\w!#$%&'*+\-/=?^`{|}~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/,
          ),
        ],
      ],
      documentType: ['Física', [Validators.required]],
      phone: ['', []],
      mobile: ['', []],
      socialSecurityCard: ['', this.cpfValidator()],
      nationalRegistry: ['', this.cnpjValidator()],
      birthday: [null],
      photo: [''],
      address: this.compact ? addressGroup : null,
    };

    this.form = !this.isEdit
      ? this.formBuilder.group({
          ...commonControls,
        })
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
        });

    this.form.get('documentType')?.valueChanges.subscribe((documentType) => {
      this.updateFieldValidators(documentType, true);
    });
    // Inicializa validações corretas para o tipo atual
    this.updateFieldValidators(this.form.get('documentType')?.value, false);
  }

  private resetAddressForm(): void {
    this.addressFormGroup.reset();

    // Remove validators dos campos do grupo address
    Object.keys(this.addressFormGroup.controls).forEach((key) => {
      this.addressFormGroup.get(key)?.clearValidators();
      this.addressFormGroup.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Restaura os validadores obrigatórios do addressFormGroup
   */
  private restoreAddressValidators(): void {
    const controls = this.addressFormGroup.controls;
    if (controls['name']) {
      controls['name'].setValidators([Validators.required]);
    }

    if (controls['type']) {
      controls['type'].setValidators([Validators.required]);
    }

    if (controls['zipCode']) {
      controls['zipCode'].setValidators([Validators.required]);
    }

    if (controls['state']) {
      controls['state'].setValidators([Validators.required]);
    }

    if (controls['city']) {
      controls['city'].setValidators([Validators.required]);
    }

    if (controls['street']) {
      controls['street'].setValidators([Validators.required]);
    }

    if (controls['number']) {
      controls['number'].setValidators([Validators.required]);
    }

    if (controls['country']) {
      controls['country'].setValue('BR');
      controls['country'].setValidators([Validators.required]);
    }

    if (controls['isDefault']) {
      controls['isDefault'].setValue(false);
    }

    // Campos opcionais não recebem validadores
    Object.keys(controls).forEach((key) =>
      controls[key].updateValueAndValidity(),
    );
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('documentType')?.disable();
      this.form.get('socialSecurityCard')?.disable();
      this.form.get('nationalRegistry')?.disable();
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const patch = { ...this.data };
      this.form.patchValue(patch);
    }

    if (this.data?.addresses && this.data.addresses.length > 0) {
      this.canDisplayAddressForm = false;
      this.resetAddressForm();
    }
  }

  private updateFieldValidators(
    documentType: string,
    clearBirthday: boolean,
  ): void {
    if (documentType === 'Física') {
      this.form
        .get('socialSecurityCard')
        ?.setValidators([Validators.required, this.cpfValidator()]);
      this.form.get('nationalRegistry')?.clearValidators();
      this.form.get('nationalRegistry')?.setValue('');
      this.form.get('birthday')?.setValidators([Validators.required]);
    } else if (documentType === 'Jurídica') {
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
