import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  Driver,
  DriverService,
  ModalService,
  NotificationService,
  TranslationService,
  TripDriver,
  TripDriverService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { TripDriverFormComponent } from './trip-driver-form.component';

describe('TripDriverFormComponent', () => {
  let driverServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
    showConfirmation: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let tripDriverServiceMock: {
    addTemporary: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const drivers: Driver[] = [
    {
      id: 'd1',
      name: 'João',
      licenseNumber: 'L1',
      licenseExpiryDate: new Date('2099-01-01'),
    } as Driver,
    {
      id: 'd2',
      name: 'Maria',
      licenseNumber: 'L2',
      licenseExpiryDate: new Date('2000-01-01'),
    } as Driver,
    {
      id: 'd3',
      name: 'Carlos',
      licenseNumber: 'L3',
      licenseExpiryDate: undefined,
    } as unknown as Driver,
    {
      id: 'd4',
      name: 'Paula',
      licenseNumber: 'L4',
      licenseExpiryDate: 'not-a-date' as unknown as Date,
    } as Driver,
    {
      id: 'd5',
      name: undefined,
      licenseNumber: 'L5',
      licenseExpiryDate: null,
    } as unknown as Driver,
  ];

  function createComponent(): TripDriverFormComponent {
    driverServiceMock = {
      getAll: vi
        .fn()
        .mockReturnValue(of({ data: drivers } as WebApiResponse<Driver[]>)),
    };
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
      showConfirmation: vi.fn(),
      showNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    tripDriverServiceMock = {
      addTemporary: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    cdrMock = { markForCheck: vi.fn() };

    return new TripDriverFormComponent(
      driverServiceMock as unknown as DriverService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      tripDriverServiceMock as unknown as TripDriverService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize a create-mode form without an id control and auto-resolve driverId from driverName', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();

      // Act
      component.form.get('driverName')!.setValue('João');

      // Assert
      expect(component.form.get('driverId')!.value).toBe('d1');
    });

    it('should leave driverId untouched when the typed driverName matches no driver', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('driverName')!.setValue('Ninguém');

      // Assert
      expect(component.form.get('driverId')!.value).toBe('');
    });

    it('should initialize an edit-mode form with an id control and disable driverName', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
      expect(component.form.get('driverName')!.disabled).toBe(true);
    });

    it('should patch the form with the provided data', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 't1', driverName: 'João', amount: 100 } as TripDriver;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('driverName')!.value).toBe('João');
      expect(component.form.get('amount')!.value).toBe(100);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form when data changes after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.data = { id: 't1', driverName: 'Maria' } as TripDriver;
      component.ngOnChanges({ data: {} as any });

      // Assert
      expect(component.form.get('driverName')!.value).toBe('Maria');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: {} as any });

      // Assert
      expect(component.form.get('driverName')!.value).toBe('');
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 't1' } as TripDriver;

      // Act
      // Assert
      expect(() => component.ngOnChanges({ data: {} as any })).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe the driverName auto-resolve subscription when destroyed', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      component.form.get('driverName')!.setValue('João');

      // Assert
      expect(component.form.get('driverId')!.value).toBe('');
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
      expect(component.submitted).toBe(true);
      expect(component.form.get('driverId')!.touched).toBe(true);
    });

    it('should create a temporary trip driver when there is no parentId', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.setValue({
        driverId: 'd1',
        driverName: 'João',
        driverLicenseNumber: 'L1',
        driverLicenseExpiryDate: null,
        amount: 100,
      });
      const response = { message: 'OK', status: 'success' } as unknown as WebApiResponse<TripDriver>;
      tripDriverServiceMock.addTemporary.mockReturnValue(of(response));

      // Act
      component.submit().subscribe();

      // Assert
      expect(tripDriverServiceMock.addTemporary).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'OK', 'success');
    });

    it('should add a new trip driver against the parent trip when creating with a parentId', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'trip1';
      component.ngOnInit();
      component.form.setValue({
        driverId: 'd1',
        driverName: 'João',
        driverLicenseNumber: 'L1',
        driverLicenseExpiryDate: null,
        amount: 100,
      });
      const response = { message: 'OK', status: 'success' } as unknown as WebApiResponse<TripDriver>;
      tripDriverServiceMock.add.mockReturnValue(of(response));

      // Act
      component.submit().subscribe();

      // Assert
      expect(tripDriverServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ tripId: 'trip1' }),
      );
    });

    it('should merge the raw form value into data and update when editing with a parentId', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'trip1';
      component.isEdit = true;
      component.data = { id: 'td1' } as TripDriver;
      component.ngOnInit();
      component.form.get('driverId')!.setValue('d1');
      component.form.get('amount')!.setValue(50);
      const response = { message: 'Updated', status: 'success' } as unknown as WebApiResponse<TripDriver>;
      tripDriverServiceMock.update.mockReturnValue(of(response));

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data).toMatchObject({ id: 'td1', driverId: 'd1', amount: 50 });
      expect(tripDriverServiceMock.update).toHaveBeenCalled();
      expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
    });

    it('should close the dialog when saving succeeds and a dialogRef is present', () => {
      // Arrange
      const component = createComponent();
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.ngOnInit();
      component.form.get('driverId')!.setValue('d1');
      component.form.get('amount')!.setValue(10);
      const response = { message: 'OK', status: 'success' } as unknown as WebApiResponse<TripDriver>;
      tripDriverServiceMock.addTemporary.mockReturnValue(of(response));

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(response);
    });

    it('should notify an error when saving fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('driverId')!.setValue('d1');
      component.form.get('amount')!.setValue(10);
      tripDriverServiceMock.addTemporary.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'COMMON.SAVE_ERROR',
      );
    });
  });

  it('should hide the modal via the dialogRef when cancel is called', () => {
    // Arrange
    const component = createComponent();
    const dialogRefMock = {};
    component.dialogRef = dialogRefMock as any;

    // Act
    component.cancel();

    // Assert
    expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
  });

  describe('remove', () => {
    it('should delete the trip driver and notify success when confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'td1' } as TripDriver;
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      const response = { message: 'Removed', status: 'success' } as unknown as WebApiResponse<TripDriver>;
      tripDriverServiceMock.delete.mockReturnValue(of(response));

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith();
      expect(tripDriverServiceMock.delete).toHaveBeenCalledWith(component.data);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Removed', 'success');
    });

    it('should notify an error when the delete request fails', async () => {
      // remove() subscribes with no error callback, same as the production code path - RxJS
      // reports that as an unhandled error via a scheduled setTimeout (see reportUnhandledError)
      // after the tap side-effect below runs, so this test silences that reporting until that
      // macrotask has actually fired before restoring the original hook.
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        // Arrange
        const component = createComponent();
        component.data = { id: 'td1' } as TripDriver;
        component.ngOnInit();
        modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
        tripDriverServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        expect(() => component.remove()).not.toThrow();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          'error',
          'COMMON.SAVE_ERROR',
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should re-open the details modal when the deletion is cancelled', async () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'td1' } as TripDriver;
      component.parentId = 'trip1';
      component.parentData = [];
      component.ngOnInit();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isEdit: true,
          data: component.data,
          id: 'td1',
          parentId: 'trip1',
          parentData: [],
        }),
      );
    });
  });

  describe('onDriverNameBlur', () => {
    it('should clean the selection when the typed name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('driverName')!.setValue('   ');

      // Act
      component.onDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('driverId')!.value).toBe('');
      expect(component.form.get('driverId')!.hasError('required')).toBe(true);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should do nothing further when the typed name matches an existing driver', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('driverName')!.setValue('João');

      // Act
      component.onDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new driver, then select it once created', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('driverName')!.setValue('Novo Motorista');

      const newDriver = { id: 'd9', name: 'Novo Motorista', licenseNumber: 'L9', licenseExpiryDate: null } as unknown as Driver;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({
        afterClosed: () => of({ data: newDriver } as WebApiResponse<Driver>),
      });

      // Act
      component.onDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalled();
      expect(component.form.get('driverId')!.value).toBe('d9');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should clean the selection when the new-driver modal closes without data', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('driverName')!.setValue('Novo Motorista');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('driverId')!.value).toBe('');
      expect(component.form.get('driverId')!.hasError('required')).toBe(true);
    });

    it('should clean the selection when the user declines creating a new driver', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('driverName')!.setValue('Novo Motorista');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('driverId')!.value).toBe('');
      expect(component.form.get('driverId')!.hasError('required')).toBe(true);
    });
  });

  describe('selectDriver', () => {
    it('should do nothing when no driver is given', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.selectDriver(null as unknown as Driver)).not.toThrow();
      expect(component.form.get('driverId')!.value).toBe('');
    });

    it('should notify and clean the selection when the driver is already attached to the trip', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'td1' } as TripDriver;
      component.parentData = [{ id: 'td2', driverId: 'd1' } as TripDriver];
      component.ngOnInit();

      // Act
      component.selectDriver(drivers[0]);

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalled();
      expect(component.form.get('driverId')!.value).toBe('');
    });

    it('should re-add the driverId control if missing, then patch the selected driver', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.removeControl('driverId');

      // Act
      component.selectDriver(drivers[0]);

      // Assert
      expect(component.form.get('driverId')!.value).toBe('d1');
      expect(component.form.get('driverName')!.value).toBe('João');
      expect(component.form.get('driverLicenseNumber')!.value).toBe('L1');
    });

    it('should patch the selected driver onto the form', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.selectDriver(drivers[0]);

      // Assert
      expect(component.form.get('driverId')!.value).toBe('d1');
      expect(component.form.get('driverLicenseExpiryDate')!.value).toEqual(
        drivers[0].licenseExpiryDate,
      );
    });
  });

  describe('filteredDriversByName$ / autocomplete', () => {
    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Driver[] = [];

      // Act
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should filter by name case-insensitively and flag alreadyUsed/licenseExpired drivers', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'td-current' } as TripDriver;
      component.parentData = [{ id: 'td-other', driverId: 'd1' } as TripDriver];
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue('joão');

      // Assert
      expect(result).toEqual([
        expect.objectContaining({ id: 'd1', alreadyUsed: true, licenseExpired: false }),
      ]);
    });

    it('should not flag a driver as alreadyUsed when the match belongs to the record being edited', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'td-other' } as TripDriver;
      component.parentData = [{ id: 'td-other', driverId: 'd1' } as TripDriver];
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue('joão');

      // Assert
      expect(result[0]).toMatchObject({ id: 'd1', alreadyUsed: false });
    });

    it('should flag a driver with a past license expiry date', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue('maria');

      // Assert
      expect(result[0]).toMatchObject({ id: 'd2', licenseExpired: true });
    });

    it('should treat a missing license expiry date as not expired', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue('carlos');

      // Assert
      expect(result[0]).toMatchObject({ id: 'd3', licenseExpired: false });
    });

    it('should treat an unparseable license expiry date as not expired', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue('paula');

      // Assert
      expect(result[0]).toMatchObject({ id: 'd4', licenseExpired: false });
    });

    it('should treat a nameless driver as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue('maria');

      // Assert
      expect(result.find((d) => d.id === 'd5')).toBeUndefined();
    });

    it('should coerce a non-string driverName value to an empty filter', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Driver[] = [];
      component.filteredDriversByName$.subscribe((r) => (result = r));

      // Act
      component.form.get('driverName')!.setValue(123 as unknown as string);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('driversArray$', () => {
    it('should fall back to an empty array when the response carries no data', () => {
      // Arrange
      const component = createComponent();
      driverServiceMock.getAll.mockReturnValue(of({} as WebApiResponse<Driver[]>));
      component.ngOnInit();

      let result: Driver[] = [];

      // Act
      component.driversArray$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });
  });
});
