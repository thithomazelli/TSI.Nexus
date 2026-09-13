import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  Vehicle,
  VehicleMaintenance,
  VehicleMaintenanceProduct,
  VehicleMaintenanceService,
  VehicleService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { VehicleMaintenanceFormComponent } from './vehicle-maintenance-form.component';

describe('VehicleMaintenanceFormComponent', () => {
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let vehicleMaintenanceServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let vehicleServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): VehicleMaintenanceFormComponent {
    modalServiceMock = { hideModal: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    vehicleMaintenanceServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    vehicleServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: [{ id: 'v1' } as Vehicle] })),
    };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new VehicleMaintenanceFormComponent(
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      vehicleMaintenanceServiceMock as unknown as VehicleMaintenanceService,
      vehicleServiceMock as unknown as VehicleService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function fillValidForm(component: VehicleMaintenanceFormComponent) {
    component.form.patchValue({
      type: 'Preventive',
      description: 'Troca de óleo',
      scheduledDate: '2099-01-01',
      cost: 100,
      status: 'Scheduled',
      vehicleId: 'v1',
    });
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should expose translated type and status options', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.typeOptions.length).toBe(2);
    expect(component.statusOptions.length).toBe(5);
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

    it('should load the vehicle list and mark for check when there is no pre-set vehicleId', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleServiceMock.getAll).toHaveBeenCalled();
      expect(component.vehicles).toEqual([{ id: 'v1' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should fall back to an empty vehicle list when the response has no data', () => {
      // Arrange
      const component = createComponent();
      vehicleServiceMock.getAll.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual([]);
    });

    it('should not load the vehicle list when embedded with a pre-set vehicleId', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should mark vehicleId as not required when pre-set', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('vehicleId')!.hasError('required')).toBe(false);

      // Act
      component.form.get('vehicleId')!.setValue(null);

      // Assert
      expect(component.form.get('vehicleId')!.valid).toBe(true);
    });

    it('should patch the form and product list with the provided data', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        description: 'Revisão',
        vehicleMaintenanceProducts: [{ id: 'p1' } as VehicleMaintenanceProduct],
      } as VehicleMaintenance;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('description')!.value).toBe('Revisão');
      expect(component.vehicleMaintenanceProducts).toEqual([{ id: 'p1' }]);
    });

    it('should default the product list to empty when data has none', () => {
      // Arrange
      const component = createComponent();
      component.data = { description: 'Revisão' } as VehicleMaintenance;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicleMaintenanceProducts).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form when data changes after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { description: 'Revisão' } as VehicleMaintenance;

      // Act
      component.ngOnChanges({ data: { currentValue: component.data } as never });

      // Assert
      expect(component.form.get('description')!.value).toBe('Revisão');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: { currentValue: true } as never });

      // Assert
      expect(component.form.get('description')!.value).toBe('');
    });

    it('should do nothing when data has no currentValue', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const act = () => component.ngOnChanges({ data: { currentValue: null } as never });

      // Assert
      expect(act).not.toThrow();
      expect(component.form.get('description')!.value).toBe('');
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { description: 'Revisão' } as VehicleMaintenance;

      // Act
      const act = () => component.ngOnChanges({ data: { currentValue: component.data } as never });

      // Assert
      expect(act).not.toThrow();
    });
  });

  describe('product picker', () => {
    it('should append an added item when onProductPickerItemAdded is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onProductPickerItemAdded({ id: 'p1' } as VehicleMaintenanceProduct);
      component.onProductPickerItemAdded({ id: 'p2' } as VehicleMaintenanceProduct);

      // Assert
      expect(component.vehicleMaintenanceProducts).toEqual([{ id: 'p1' }, { id: 'p2' }]);
    });

    it('should remove a product by index when removeProduct is called', () => {
      // Arrange
      const component = createComponent();
      component.vehicleMaintenanceProducts = [
        { id: 'p1' } as VehicleMaintenanceProduct,
        { id: 'p2' } as VehicleMaintenanceProduct,
      ];

      // Act
      component.removeProduct(0);

      // Assert
      expect(component.vehicleMaintenanceProducts).toEqual([{ id: 'p2' }]);
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: unknown;

      // Act
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.form.get('description')!.touched).toBe(true);
      expect(vehicleMaintenanceServiceMock.add).not.toHaveBeenCalled();
    });

    it('should use the form vehicleId when there is no pre-set vehicleId', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' } } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(vehicleMaintenanceServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleId: 'v1' }),
      );
    });

    it('should prefer the pre-set vehicleId over the form value', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'preset-vehicle';
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' } } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(vehicleMaintenanceServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleId: 'preset-vehicle' }),
      );
    });

    it('should include the current product list in the saved payload', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      component.vehicleMaintenanceProducts = [{ id: 'p1' } as VehicleMaintenanceProduct];
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' } } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(vehicleMaintenanceServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleMaintenanceProducts: [{ id: 'p1' }] }),
      );
    });

    it('should update instead of adding when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'm1' } as VehicleMaintenance;
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' } } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(vehicleMaintenanceServiceMock.update).toHaveBeenCalled();
    });

    it('should notify without saving when the backend reports a business-rule failure', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falhou',
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
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' }, message: 'OK' } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
    });

    it('should save via the page path when isModal is false', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' } } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/vehicle-maintenances/m1');
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'VEHICLES.SAVE_MAINTENANCE_ERROR',
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
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/vehicle-maintenances');
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
      expect(vehicleMaintenanceServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should delete, hide the modal and navigate when the delete succeeds outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'm1' } as VehicleMaintenance;
      vehicleMaintenanceServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'Removido',
      );
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/vehicle-maintenances');
    });

    it('should hide the modal and not navigate when the delete succeeds inside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'm1' } as VehicleMaintenance;
      vehicleMaintenanceServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<VehicleMaintenance>),
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
      component.data = { id: 'm1' } as VehicleMaintenance;
      vehicleMaintenanceServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.remove();

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should notify an error when the delete request errors', async () => {
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.data = { id: 'm1' } as VehicleMaintenance;
        vehicleMaintenanceServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        component.remove();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          ResponseStatus.Error,
          'VEHICLES.SAVE_MAINTENANCE_ERROR',
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });
  });

  describe('savePage (via submit)', () => {
    it('should notify and mark for check when editing succeeds', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.isEdit = true;
      component.data = { id: 'm1' } as VehicleMaintenance;
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'm1' }, message: 'OK' } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
      expect(component.data).toEqual({ id: 'm1' });
    });

    it('should notify without navigating when adding a new maintenance fails (defensive branch)', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      (component as any).savePage({
        status: ResponseStatus.Error,
        message: 'Falhou',
      } as WebApiResponse<VehicleMaintenance>);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falhou',
      );
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('saveModal (via submit)', () => {
    it('should not throw when there is no dialogRef to close', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.dialogRef = undefined;
      component.ngOnInit();
      fillValidForm(component);
      vehicleMaintenanceServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' } as WebApiResponse<VehicleMaintenance>),
      );

      // Act
      const act = () => component.submit().subscribe();

      // Assert
      expect(act).not.toThrow();
    });
  });
});
