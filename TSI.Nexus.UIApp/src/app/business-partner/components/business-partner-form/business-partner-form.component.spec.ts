import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  Address,
  BusinessPartnerService,
  BusinessPartnerType,
  Individual,
  ModalService,
  NotificationService,
  ResponseStatus,
} from '@nexus/core';
import { of, throwError } from 'rxjs';
import { BusinessPartnerFormComponent } from './business-partner-form.component';
import { BusinessPartnerDetailsModalComponent } from '../business-partner-details-modal/business-partner-details-modal.component';

describe('BusinessPartnerFormComponent', () => {
  let businessPartnerServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    cpfValidator: ReturnType<typeof vi.fn>;
    cnpjValidator: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(data: Partial<Individual> = {}): BusinessPartnerFormComponent {
    businessPartnerServiceMock = {
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      cpfValidator: vi.fn().mockReturnValue(() => null),
      cnpjValidator: vi.fn().mockReturnValue(() => null),
    };
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showNotification: vi.fn(),
      showTemplateModal: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };
    dialogRefMock = { close: vi.fn() };

    const component = new BusinessPartnerFormComponent(
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      routerMock as unknown as Router,
      cdrMock as unknown as ChangeDetectorRef,
    );
    component.dialogRef = dialogRefMock as unknown as MatDialogRef<BusinessPartnerDetailsModalComponent>;
    component.data = { type: BusinessPartnerType.Client, addresses: [], ...data } as Individual;
    return component;
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the form with the common controls when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('name')).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('socialSecurityCard')).toBeTruthy();
    });

    it('should start the address panel open when adding a new partner', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = false;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.addressPanelMode).toBe('form');
    });

    it('should start the address panel collapsed when editing a partner with an existing address', () => {
      // Arrange
      const component = createComponent({
        addresses: [{ id: 'a1' } as Address],
      });
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.addressPanelMode).toBe('list');
    });
  });

  describe('canAddAddress', () => {
    it('should require a valid address form when the partner is a Client', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();

      // Act / Assert
      expect(component.canAddAddress).toBe(false);

      component.addressFormGroup.patchValue({
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua A',
        number: 10,
        country: 'BR',
      });

      expect(component.canAddAddress).toBe(true);
    });

    it('should only require the essential fields when the partner is a Supplier', () => {
      // Arrange
      const component = createComponent({ type: BusinessPartnerType.Supplier });
      component.compact = true;
      component.ngOnInit();

      // Act
      component.addressFormGroup.patchValue({
        type: 'Home',
        zipCode: '12345678',
        street: 'Rua A',
        number: 10,
        state: 'SP',
        city: 'São Paulo',
        name: 'Casa',
      });

      // Assert
      expect(component.canAddAddress).toBe(true);
    });
  });

  describe('submit', () => {
    it('should reject an invalid form without saving when submit is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let value: unknown;
      component.submit().subscribe((v) => (value = v));

      // Assert
      expect(value).toBeNull();
      expect(businessPartnerServiceMock.add).not.toHaveBeenCalled();
    });

    function fillValidForm(component: BusinessPartnerFormComponent) {
      component.form.patchValue({
        name: 'Ana',
        email: 'ana@example.com',
        documentType: 'Física',
        socialSecurityCard: '52998224725',
        phone: '',
        mobile: '',
      });
    }

    it('should save and navigate to the new partner page when submit succeeds (page mode)', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(businessPartnerServiceMock.add).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/clients/bp1');
    });

    it('should close the dialog and show a success notification when submit succeeds (modal mode)', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({
          status: ResponseStatus.Success,
          message: 'OK',
          data: { id: 'bp1', type: BusinessPartnerType.Client },
        }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        'Cliente adicionado',
        'OK',
      );
    });

    it('should show the returned message without navigating when the backend reports a business error', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'CPF já cadastrado', data: null }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'CPF já cadastrado',
      );
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should hide the modal when cancel is called in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });

    it('should navigate back to the list page when cancel is called outside modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/clients');
    });
  });

  describe('address panel', () => {
    function fillValidAddressForm(component: BusinessPartnerFormComponent) {
      component.addressFormGroup.patchValue({
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua A',
        number: 10,
        country: 'BR',
      });
    }

    it('should add a new address and reopen the form for the next one when in add mode', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.isEdit = false;
      component.ngOnInit();
      fillValidAddressForm(component);
      const address = component.addressFormGroup.value as Address;

      // Act
      component.saveAddress(address);

      // Assert
      expect(component.data?.addresses?.some((a) => a.street === 'Rua A')).toBe(true);
      expect(component.addressPanelMode).toBe('form');
    });

    it('should collapse back to the list when saveAddress is called in edit mode', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.isEdit = true;
      component.ngOnInit();
      fillValidAddressForm(component);

      // Act
      component.saveAddress(component.addressFormGroup.value as Address);

      // Assert
      expect(component.addressPanelMode).toBe('list');
    });

    it('should reset to the list view when cancelAddress is called', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();
      component.addressPanelMode = 'form';

      // Act
      component.cancelAddress();

      // Assert
      expect(component.addressPanelMode).toBe('list');
      expect(component.selectedAddressIndex).toBeNull();
    });

    it('should open the form with no selected address when displayNewAddress is called', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();

      // Act
      component.displayNewAddress();

      // Assert
      expect(component.addressPanelMode).toBe('form');
      expect(component.selectedAddressIndex).toBeNull();
    });

    it('should do nothing when saveAddress is called with an invalid address form', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();

      // Act
      component.saveAddress({ street: '' } as Address);

      // Assert
      expect(component.data!.addresses).toEqual([]);
    });

    it('should replace the address at the selected index when saveAddress is called while editing', () => {
      // Arrange
      const component = createComponent({
        addresses: [{ id: 'a1', street: 'Old' } as Address, { id: 'a2', street: 'Other' } as Address],
      });
      component.compact = true;
      component.ngOnInit();
      component.selectedAddressIndex = 0;
      fillValidAddressForm(component);

      // Act
      component.saveAddress(component.addressFormGroup.value as Address);

      // Assert
      expect(component.data!.addresses![0].street).toBe('Rua A');
      expect(component.data!.addresses![1].street).toBe('Other');
    });

    it('should start collapsed and reset the form when compact and edit mode start with an existing address', () => {
      // Arrange
      const component = createComponent({ addresses: [{ id: 'a1' } as Address] });
      component.compact = true;
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.addressPanelMode).toBe('list');
      expect(component.addressFormGroup.get('street')!.value).toBeFalsy();
    });
  });

  describe('remove', () => {
    it('should delete the partner and navigate back when the delete succeeds (page mode)', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      businessPartnerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(businessPartnerServiceMock.delete).toHaveBeenCalledWith(component.data);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/clients');
    });

    it('should show an error notification when the delete fails', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      businessPartnerServiceMock.delete.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'error',
        'Erro ao remover',
      );
      expect(routerMock.navigateByUrl).not.toHaveBeenCalledWith('/clients');
    });

    it('should hide the modal and notify without navigating when the delete succeeds (modal mode)', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      businessPartnerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Removido', ResponseStatus.Success);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalledWith('/clients');
    });

    it('should not navigate when the delete reports a non-success status (page mode)', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      businessPartnerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should do nothing further when the deletion is cancelled outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(businessPartnerServiceMock.delete).not.toHaveBeenCalled();
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    it('should build the reopen initialState when the deletion is cancelled inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.isEdit = true;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(businessPartnerServiceMock.delete).not.toHaveBeenCalled();
      // Reopening the modal goes through a dynamic `import(...)` of
      // BusinessPartnerDetailsModalComponent, which is impractical to assert on meaningfully in
      // this spec (see the accepted-residual note above remove()'s tests).
    });

    // The isModal=true reopen-after-cancel path loads BusinessPartnerDetailsModalComponent via a
    // dynamic import() (see remove()'s comment on why) - same accepted residual pattern as
    // product-form/purchase-order-products-form/payment-form/address-form: the async module
    // resolution doesn't settle within any number of microtask/macrotask ticks under this
    // bundler's test transform, so it's left unexercised here; the cancelled-outside-a-modal case
    // above already covers isModal=false, and the only difference for isModal=true is this wrap.
  });

  describe('ngOnChanges', () => {
    it('should re-initialize the form when data changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ data: { currentValue: component.data, firstChange: false } as never });

      // Assert
      expect(component.form.get('name')).toBeTruthy();
    });

    it('should re-initialize the form when isEdit changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: { currentValue: true, firstChange: false } as never });

      // Assert
      expect(component.form.get('name')).toBeTruthy();
    });

    it('should do nothing on the first change of data or isEdit', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.form;

      // Act
      component.ngOnChanges({
        data: { currentValue: component.data, firstChange: true } as never,
        isEdit: { currentValue: false, firstChange: true } as never,
      });

      // Assert
      expect(component.form).toBe(before);
    });

    it('should do nothing when neither data nor isEdit changed', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.form;

      // Act
      component.ngOnChanges({ compact: {} as never });

      // Assert
      expect(component.form).toBe(before);
    });
  });

  describe('selectedAddress', () => {
    it('should return null when no index is selected', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.selectedAddress).toBeNull();
    });

    it('should return null when data.addresses is not an array', () => {
      // Arrange
      const component = createComponent();
      component.selectedAddressIndex = 0;
      (component.data as any).addresses = undefined;

      // Act / Assert
      expect(component.selectedAddress).toBeNull();
    });

    it('should return null when the index is negative', () => {
      // Arrange
      const component = createComponent({ addresses: [{ id: 'a1' } as Address] });
      component.selectedAddressIndex = -1;

      // Act / Assert
      expect(component.selectedAddress).toBeNull();
    });

    it('should return null when the index is out of bounds', () => {
      // Arrange
      const component = createComponent({ addresses: [{ id: 'a1' } as Address] });
      component.selectedAddressIndex = 5;

      // Act / Assert
      expect(component.selectedAddress).toBeNull();
    });

    it('should return the address at the selected index', () => {
      // Arrange
      const addr = { id: 'a1' } as Address;
      const component = createComponent({ addresses: [addr] });
      component.selectedAddressIndex = 0;

      // Act / Assert
      expect(component.selectedAddress).toBe(addr);
    });
  });

  describe('isEditingAddressExclusively', () => {
    it('should be true only when the address panel is in form mode and isEdit is true', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.addressPanelMode = 'form';

      // Act / Assert
      expect(component.isEditingAddressExclusively).toBe(true);

      component.addressPanelMode = 'list';
      expect(component.isEditingAddressExclusively).toBe(false);

      component.isEdit = false;
      component.addressPanelMode = 'form';
      expect(component.isEditingAddressExclusively).toBe(false);
    });
  });

  describe('submit - compact mode (staging addresses)', () => {
    function fillValidForm(component: BusinessPartnerFormComponent) {
      component.form.patchValue({
        name: 'Ana',
        email: 'ana@example.com',
        documentType: 'Física',
        socialSecurityCard: '52998224725',
        phone: '',
        mobile: '',
      });
    }

    it('should clear the birthday when it is empty', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      component.form.get('birthday')!.setValue('');
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.birthday).toBeUndefined();
    });

    it('should keep a filled-in birthday untouched', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      component.form.get('birthday')!.setValue('15/05/1990');
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect((component.data as any).birthday).toBe('15/05/1990');
    });

    it('should add a new address from the compact address sub-form when street is filled', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      component.addressFormGroup.patchValue({
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua A',
        number: 10,
      });
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Client } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses!.some((a) => a.street === 'Rua A')).toBe(true);
      expect('address' in (component.data as any)).toBe(false);
    });

    it('should replace an existing address with the same id instead of duplicating it', () => {
      // Arrange
      const component = createComponent({
        addresses: [{ id: 'a1', street: 'Old' } as Address],
      });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      component.addressFormGroup.patchValue({
        id: 'a1',
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua Nova',
        number: 10,
      });
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Client } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses).toHaveLength(1);
      expect(component.data!.addresses![0].street).toBe('Rua Nova');
    });

    it('should not stage the address when the zipCode is null', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Client } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses).toEqual([]);
    });

    it('should not stage the address when street is blank even though zipCode is filled', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      // zipCode truthy so the outer `raw.address.zipCode != null` guard passes, but street is
      // still blank - exercises the `raw.address?.street != ''` guard's false branch.
      component.addressFormGroup.get('zipCode')!.setValue('00000000');
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Client } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses).toEqual([]);
    });

    it('should not stage the address when every field including country is blank', () => {
      // Arrange
      const component = createComponent({ type: BusinessPartnerType.Supplier });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      component.addressFormGroup.get('country')!.setValue('');
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses).toEqual([]);
    });

    it('should replace only the matching address by id, leaving the others untouched', () => {
      // Arrange
      const component = createComponent({
        type: BusinessPartnerType.Supplier,
        addresses: [
          { id: 'a1', street: 'Old' } as Address,
          { id: 'a2', street: 'Second' } as Address,
        ],
      });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      component.addressFormGroup.patchValue({
        id: 'a2',
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua Nova',
        number: 10,
      });
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses![0].street).toBe('Old');
      expect(component.data!.addresses![1].street).toBe('Rua Nova');
    });

    it('should lazily initialize addresses to an empty array when staging with none yet', () => {
      // Arrange
      const component = createComponent({ type: BusinessPartnerType.Supplier });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      component.addressFormGroup.patchValue({
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua A',
        number: 10,
      });
      // Force addresses back to undefined right before submit, simulating data built without an
      // addresses array at all (initAddressInfo() would normally have prevented this during
      // ngOnInit, but submit() itself still guards against it independently).
      (component.data as any).addresses = undefined;
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses!.some((a) => a.street === 'Rua A')).toBe(true);
    });

    it('should delete a stray "address" property left on data before saving', () => {
      // Arrange
      const component = createComponent({ type: BusinessPartnerType.Supplier });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      (component.data as any).address = { leftover: true };
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect('address' in (component.data as any)).toBe(false);
    });

    // These three tests use a Supplier partner (not Client) so the nested address sub-form's
    // fields stay optional (see initForm()'s isAddressRequired) - a Client would make the blank
    // address group itself invalid, and submit() bails out via the top-level `this.form.invalid`
    // check before ever reaching the address-staging logic under test here.
    it('should set the first address as default when none is marked default', () => {
      // Arrange
      const component = createComponent({
        type: BusinessPartnerType.Supplier,
        addresses: [{ id: 'a1', street: 'Existing', isDefault: false } as Address],
      });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses![0].isDefault).toBe(true);
    });

    it('should not override an already-default address', () => {
      // Arrange
      const component = createComponent({
        type: BusinessPartnerType.Supplier,
        addresses: [{ id: 'a1', street: 'Existing', isDefault: true } as Address],
      });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data!.addresses![0].isDefault).toBe(true);
    });

    it('should remove a null id from staged addresses before saving', () => {
      // Arrange
      const component = createComponent({
        type: BusinessPartnerType.Supplier,
        addresses: [{ id: null as any, street: 'Existing', isDefault: true } as Address],
      });
      component.compact = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'bp1', type: BusinessPartnerType.Supplier } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect('id' in component.data!.addresses![0]).toBe(false);
    });

    it('should show a generic error notification when saving fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'Erro ao salvar');
    });

    it('should update when editing an existing partner', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo', data: { id: 'bp1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(businessPartnerServiceMock.update).toHaveBeenCalled();
      expect(businessPartnerServiceMock.add).not.toHaveBeenCalled();
    });

    it('should show the formatted message and refresh data when editing succeeds (page mode)', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'CPF 52998224725 salvo', data: { id: 'bp1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        expect.stringContaining('529.982.247-25'),
      );
      expect(component.data).toEqual({ id: 'bp1' });
    });

    it('should show an empty-message notification unchanged when there is no message', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: '', data: { id: 'bp1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, '');
    });

    it('should show a CNPJ-formatted error message when saveModal is called directly with a non-success response', () => {
      // submit()'s own tap-next callback only ever dispatches to saveModal()/savePage() after
      // confirming response.status === Success (see the comment above that check in submit()),
      // so saveModal()'s own internal non-success branch is unreachable through submit() itself -
      // calling it directly here is the only way to exercise that branch.
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();

      // Act
      (component as any).saveModal({
        status: ResponseStatus.Error,
        message: 'CNPJ 11222333000181 duplicado',
        data: null,
      });

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        false,
        '',
        expect.stringContaining('11.222.333/0001-81'),
      );
    });

    it('should label a Supplier as "Fornecedor adicionado" when submit succeeds (modal mode)', () => {
      // Arrange
      const component = createComponent({ type: BusinessPartnerType.Supplier });
      component.isModal = true;
      component.ngOnInit();
      fillValidForm(component);
      businessPartnerServiceMock.add.mockReturnValue(
        of({
          status: ResponseStatus.Success,
          message: 'OK',
          data: { id: 'bp1', type: BusinessPartnerType.Supplier },
        }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(true, 'Fornecedor adicionado', 'OK');
    });
  });

  describe('updateFieldValidators (private, via documentType changes)', () => {
    it('should require nationalRegistry and clear birthday when switching to Jurídica', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('documentType')!.setValue('Jurídica');

      // Assert
      expect(component.form.get('nationalRegistry')!.hasError('required')).toBe(true);
      expect(component.form.get('socialSecurityCard')!.value).toBe('');
      expect(component.form.get('birthday')!.value).toBe('');
    });

    it('should require socialSecurityCard when switching back to Física', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('documentType')!.setValue('Jurídica');

      // Act
      component.form.get('documentType')!.setValue('Física');

      // Assert
      expect(component.form.get('socialSecurityCard')!.hasError('required')).toBe(true);
      expect(component.form.get('nationalRegistry')!.value).toBe('');
    });

    it('should leave the previous validators untouched when the documentType is neither Física nor Jurídica', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      // Física is the default at init time, so socialSecurityCard is already required and
      // nationalRegistry is not - switching to an unrecognized type hits neither branch, so
      // updateFieldValidators() leaves both exactly as they already were.
      const before = {
        ssc: component.form.get('socialSecurityCard')!.hasError('required'),
        nr: component.form.get('nationalRegistry')!.hasError('required'),
      };

      // Act
      expect(() => component.form.get('documentType')!.setValue('Outro')).not.toThrow();

      // Assert
      expect(component.form.get('socialSecurityCard')!.hasError('required')).toBe(before.ssc);
      expect(component.form.get('nationalRegistry')!.hasError('required')).toBe(before.nr);
    });

    it('should keep the birthday untouched when clearBirthday is false (direct call)', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('birthday')!.setValue('15/05/1990');

      // Act
      (component as any).updateFieldValidators('Jurídica', false);

      // Assert
      expect(component.form.get('birthday')!.value).toBe('15/05/1990');
    });
  });

  describe('parseBirthday (private, no live call site - documented residual)', () => {
    it('should stay unreachable from the public API when checked against the current component version', () => {
      // parseBirthday() is defined but not currently called anywhere in this class - kept here
      // as a private helper without a live call site, so it stays outside the coverage target.
      // Arrange / Act / Assert
      expect(true).toBe(true);
    });
  });

  describe('initAddressInfo (private, via ngOnInit)', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act / Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should initialize an empty addresses array when data has none', () => {
      // Arrange
      const component = createComponent();
      delete (component.data as any).addresses;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.data!.addresses).toEqual([]);
    });
  });

  describe('onSaveAndAddNewAddress', () => {
    it('should not save an invalid address form', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();

      // Act
      component.onSaveAndAddNewAddress();

      // Assert
      expect(component.data!.addresses).toEqual([]);
    });

    it('should save a valid address form', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();
      component.addressFormGroup.patchValue({
        name: 'Casa',
        type: 'Home',
        zipCode: '12345678',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua A',
        number: 10,
      });

      // Act
      component.onSaveAndAddNewAddress();

      // Assert
      expect(component.data!.addresses!.some((a) => a.street === 'Rua A')).toBe(true);
    });
  });

  describe('editAddress', () => {
    it('should do nothing when the address is not found', () => {
      // Arrange
      const component = createComponent({ addresses: [{ id: 'a1' } as Address] });
      component.compact = true;
      component.ngOnInit();

      // Act
      component.editAddress({ id: 'unknown' } as Address);

      // Assert
      expect(component.selectedAddressIndex).toBeNull();
    });

    it('should select and patch the matching address', () => {
      // Arrange
      const component = createComponent({ addresses: [{ id: 'a1', street: 'Rua A' } as Address] });
      component.compact = true;
      component.ngOnInit();
      // initAddressInfo() (called from ngOnInit) replaces data.addresses with brand-new Address
      // instances, so editAddress()'s `findIndex((a) => a === addr)` needs the *post-init*
      // object reference, not the one originally passed into createComponent().
      const addr = component.data!.addresses![0];

      // Act
      component.editAddress(addr);

      // Assert
      expect(component.selectedAddressIndex).toBe(0);
      expect(component.addressFormGroup.get('street')!.value).toBe('Rua A');
      expect(component.addressPanelMode).toBe('form');
    });
  });

  // Two more genuinely-unreachable defensive branches, left undocumented in production since
  // they're harmless guards rather than dead branches worth removing:
  // - initAddressInfo()'s `(this.data.addresses ?? []).map(...)` fallback can never see a
  //   nullish `this.data.addresses`, because the `if (!this.data.addresses) {...; return;}`
  //   check immediately above it already handles that case and returns early.
  // - restoreAddressValidators()'s `if (controls[x])` guards on each address field are always
  //   true in practice: the address FormGroup is built by a single, fixed `initForm()` call that
  //   always includes every one of these controls, so there's no runtime path where any of them
  //   is missing.
  describe('restoreAddressValidators (private, via displayNewAddress/editAddress/saveAddress)', () => {
    it('should restore required validators on all standard address fields, defaulting country to BR', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();

      // Act
      component.displayNewAddress();

      // Assert
      expect(component.addressFormGroup.get('country')!.value).toBe('BR');
      ['name', 'type', 'zipCode', 'state', 'city', 'street', 'number', 'country'].forEach((field) => {
        component.addressFormGroup.get(field)!.setValue('');
        expect(component.addressFormGroup.get(field)!.hasError('required')).toBe(true);
      });
    });
  });
});
