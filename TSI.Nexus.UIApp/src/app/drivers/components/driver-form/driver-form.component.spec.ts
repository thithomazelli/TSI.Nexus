import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BusinessPartnerService,
  Driver,
  DriverService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { DriverFormComponent } from './driver-form.component';

describe('DriverFormComponent', () => {
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let driverServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let businessPartnerServiceMock: { cpfValidator: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(): DriverFormComponent {
    modalServiceMock = { hideModal: vi.fn(), showNotification: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    driverServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    businessPartnerServiceMock = { cpfValidator: vi.fn().mockReturnValue(() => null) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new DriverFormComponent(
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      driverServiceMock as unknown as DriverService,
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
    );
  }

  function validRawValue() {
    return {
      name: 'João',
      email: 'joao@example.com',
      phone: '',
      mobile: '',
      socialSecurityCard: '52998224725',
      nationalIdCard: '',
      birthday: new Date('1990-01-01'),
      licenseNumber: '12345678901',
      licenseCategory: 'B',
      licenseExpiryDate: new Date('2099-01-01'),
      employmentType: 'CLT',
      admissionDate: null,
      status: 'Active',
      commissionPercentage: 0,
    };
  }

  function fillValidForm(component: DriverFormComponent) {
    component.form.patchValue(validRawValue());
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should expose translated employment type and status options when created', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.employmentTypeOptions.length).toBe(3);
    expect(component.statusOptions.length).toBe(3);
  });

  describe('ngOnInit', () => {
    it('should build a form without an id control when adding', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();
    });

    it('should build a form with an id control when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
    });

    it('should patch the form when data is provided', () => {
      // Arrange
      const component = createComponent();
      component.data = { name: 'Maria' } as Driver;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('name')!.value).toBe('Maria');
    });
  });

  describe('ngOnChanges', () => {
    it('should patch the form when data changes to a new value after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { name: 'Maria' } as Driver;

      // Act
      component.ngOnChanges({ data: { currentValue: component.data } as never });

      // Assert
      expect(component.form.get('name')!.value).toBe('Maria');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: { currentValue: true } as never });

      // Assert
      expect(component.form.get('name')!.value).toBe('');
    });

    it('should do nothing when data has no currentValue', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({ data: { currentValue: null } as never }),
      ).not.toThrow();
      expect(component.form.get('name')!.value).toBe('');
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({ data: { currentValue: { name: 'Maria' } } as never }),
      ).not.toThrow();
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.form.get('name')!.touched).toBe(true);
      expect(driverServiceMock.add).not.toHaveBeenCalled();
    });

    it('should add a new driver when not editing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'd1' } } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(driverServiceMock.add).toHaveBeenCalled();
    });

    it('should merge the raw value into data and update when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'd1' } as Driver;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'd1' } } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(driverServiceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'd1', name: 'João' }),
      );
    });

    it('should notify without saving when the backend reports a business-rule failure', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'CPF duplicado' } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'CPF duplicado',
      );
    });

    it('should save via the modal path when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'd1' }, message: 'OK' } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should save via the page path when isModal is false', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'd1' } } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/drivers/d1');
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Erro ao salvar',
      );
    });
  });

  describe('cancel', () => {
    it('should hide the modal when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });

    it('should navigate back to the list when isModal is false', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/drivers');
    });
  });

  describe('remove', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      component.remove();

      // Assert
      expect(driverServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should delete, hide the modal and navigate when deletion succeeds outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'd1' } as Driver;
      driverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<Driver>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'Removido',
      );
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/drivers');
    });

    it('should hide the modal and not navigate when deletion succeeds inside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'd1' } as Driver;
      driverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<Driver>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not navigate when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'd1' } as Driver;
      driverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<Driver>),
      );

      // Act
      component.remove();

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should notify an error when the delete request errors', async () => {
      // remove() subscribes with no error callback, so RxJS reports the error via a scheduled
      // setTimeout (see reportUnhandledError) after the tap side-effect below runs - silence that
      // reporting until the macrotask has actually fired before restoring the original hook.
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.data = { id: 'd1' } as Driver;
        driverServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        component.remove();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          ResponseStatus.Error,
          'Erro ao remover',
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });
  });

  describe('saveModal (via submit)', () => {
    it('should show a success notification with the edit wording when editing', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.isEdit = true;
      component.data = { id: 'd1' } as Driver;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        'Motorista atualizado',
        'OK',
      );
    });

    it('should show a success notification with the create wording when adding', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        'Motorista adicionado',
        'OK',
      );
    });

    it('should not throw when there is no dialogRef to close', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.dialogRef = undefined;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' } as WebApiResponse<Driver>),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });
  });

  describe('savePage (via submit)', () => {
    it('should notify without navigating when the save reports an error', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      driverServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<Driver>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falhou',
      );
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should notify without navigating when adding a new driver fails through the defensive branch', () => {
      // submit()'s next handler already short-circuits on a non-Success status before ever
      // calling savePage()/saveModal(), so this exercises the same defensive check those private
      // methods carry on their own, in case they are ever invoked another way.
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      (component as any).savePage({
        status: ResponseStatus.Error,
        message: 'Falhou',
      } as WebApiResponse<Driver>);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falhou',
      );
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('saveModal (defensive branch)', () => {
    it('should show a failure notification when the status is not Success', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;

      // Act
      (component as any).saveModal({
        status: ResponseStatus.Error,
        message: 'Falhou',
      } as WebApiResponse<Driver>);

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(false, '', 'Falhou');
    });
  });
});
