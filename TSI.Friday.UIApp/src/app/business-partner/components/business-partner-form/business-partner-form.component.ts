import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import {
  Address,
  ApiType,
  BusinessPartner,
  BusinessPartnerService,
  BusinessPartnerType,
  Company,
  FormBaseComponent,
  Individual,
  ModalService,
  NotificationService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';

import { Observable, of, tap } from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../business-partner-details-modal/business-partner-details-modal.component';

@Component({
  selector: 'app-business-partner-form',
  templateUrl: './business-partner-form.component.html',
  styleUrl: './business-partner-form.component.scss',
  standalone: false,
})
export class BusinessPartnerFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Individual | Company | null = <BusinessPartner>{};

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<BusinessPartnerDetailsModalComponent>;

  canDisplayClientButtons = true;
  canDisplayAddressForm = true;
  canDisplayAddressButtons = false;
  canDisplayNewAddressLink = false;
  selectedAddressIndex: number | null = null;

  private _baseEndPoint: ApiType = ApiType.BusinessPartners;

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private routerService: Router,
  ) {
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

  submit(): Observable<WebApiResponse<BusinessPartner> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const raw = this.form.getRawValue();
    if (!raw.birthday || raw.birthday === '') {
      delete this.data!.birthday;
    }

    if (this.compact && raw.address && raw.address.zipCode != null) {
      // Se vier address preenchido, mova para addresses
      if (Object.keys(raw.address).some((k) => raw.address[k])) {
        if (!this.data!.addresses) {
          this.data!.addresses = [];
        }
        // Se address já existe em addresses (por id ou igualdade), substitui, senão adiciona
        const idx = this.data!.addresses.findIndex(
          (a) => a.id && raw.address.id && a.id === raw.address.id,
        );

        if (idx !== -1) {
          this.data!.addresses[idx] = new Address({ ...raw.address });
        } else if (raw.address?.street != '') {
          this.data!.addresses.push(new Address({ ...raw.address }));
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
      if (
        Array.isArray(this.data?.addresses) &&
        this.data.addresses.length > 0 &&
        !this.data.addresses.find((addr) => addr.isDefault)
      ) {
        this.data!.addresses![0].isDefault = true;
      }

      this.data?.addresses.find((addr) => {
        if (addr.id == null) {
          delete addr.id;
        }
      });
    } else {
      Object.assign(this.data!, raw);
    }

    return this.save(this.data!).pipe(
      tap({
        next: (response: WebApiResponse<BusinessPartner>) => {
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
    const isAddressRequired = this.data?.type == BusinessPartnerType.Client;

    const addressGroup = this.formBuilder.group({
      id: [null],
      name: ['', isAddressRequired ? Validators.required : null],
      type: [null, isAddressRequired ? Validators.required : null],
      zipCode: ['', isAddressRequired ? Validators.required : null],
      state: ['', isAddressRequired ? Validators.required : null],
      city: ['', isAddressRequired ? Validators.required : null],
      street: ['', isAddressRequired ? Validators.required : null],
      number: [null, isAddressRequired ? Validators.required : null],
      comments: [''],
      businessPartnerId: [null],
      country: ['BR', isAddressRequired ? Validators.required : null],
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
      type: [this.data?.type, Validators.required],
      documentType: ['Física', [Validators.required]],
      phone: ['', []],
      mobile: ['', []],
      socialSecurityCard: ['', this.businessPartnerService.cpfValidator()],
      nationalRegistry: ['', this.businessPartnerService.cnpjValidator()],
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
        ?.setValidators([
          Validators.required,
          this.businessPartnerService.cpfValidator(),
        ]);
      this.form.get('nationalRegistry')?.clearValidators();
      this.form.get('nationalRegistry')?.setValue('');
    } else if (documentType === 'Jurídica') {
      this.form
        .get('nationalRegistry')
        ?.setValidators([
          Validators.required,
          this.businessPartnerService.cnpjValidator(),
        ]);
      this.form.get('socialSecurityCard')?.clearValidators();
      this.form.get('socialSecurityCard')?.setValue('');
      if (clearBirthday) {
        this.form.get('birthday')?.setValue('');
      }
    }
    this.form.get('socialSecurityCard')?.updateValueAndValidity();
    this.form.get('nationalRegistry')?.updateValueAndValidity();
    this.form.get('birthday')?.updateValueAndValidity();
  }

  private save(
    businessPartner: Company | Individual,
  ): Observable<WebApiResponse<BusinessPartner>> {
    return this.isEdit && this.data
      ? this.businessPartnerService.update(businessPartner)
      : this.businessPartnerService.add(businessPartner);
  }

  private saveModal(response: WebApiResponse<BusinessPartner>): any {
    this.dialogRef?.close(response);

    if (response.status == ResponseStatus.Success) {
      this.modalService.showNotification(
        response.status == ResponseStatus.Success,
        response.data.type === BusinessPartnerType.Client
          ? 'Cliente adicionado'
          : 'Fornecedor adicionado',
        response.message,
      );
      return;
    }

    this.modalService.showNotification(false, '', response.message);
  }

  private savePage(response: WebApiResponse<BusinessPartner>): any {
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
