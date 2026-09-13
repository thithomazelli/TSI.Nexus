import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BusinessPartner,
  BusinessPartnerService,
  Driver,
  DriverService,
  ModalService,
  NotificationService,
  ResponseStatus,
  Trip,
  TripDriver,
  TripDriverService,
  TripService,
  TranslationService,
  Vehicle,
  VehicleService,
  WebApiResponse,
} from '@nexus/core';
import { Subject, config, of, throwError } from 'rxjs';
import { TripFormComponent } from './trip-form.component';

describe('TripFormComponent', () => {
  let businessPartnerServiceMock: {
    getClients: ReturnType<typeof vi.fn>;
    addOrUpdateBusinessPartner: ReturnType<typeof vi.fn>;
  };
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
  let tripServiceMock: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let tripDriverAdded$: Subject<TripDriver>;
  let tripDriverServiceMock: {
    tripDriverAdded$: Subject<TripDriver>;
    add: ReturnType<typeof vi.fn>;
  };
  let vehicleServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const clients: BusinessPartner[] = [
    { id: 'bp1', name: 'Cliente Um' } as BusinessPartner,
    { id: 'bp2', name: 'Cliente Dois' } as BusinessPartner,
  ];
  const vehicles: Vehicle[] = [
    { id: 'v1', plate: 'ABC1234', brand: 'Ford', model: 'Ka' } as Vehicle,
    { id: 'v2', plate: 'XYZ9876', brand: 'Fiat', model: 'Uno' } as Vehicle,
  ];
  const drivers: Driver[] = [
    { id: 'd1', name: 'João', licenseNumber: '123', licenseExpiryDate: new Date('2099-01-01') } as Driver,
    { id: 'd2', name: 'Maria', licenseNumber: '456', licenseExpiryDate: new Date('2000-01-01') } as Driver,
  ];

  function createComponent(): TripFormComponent {
    businessPartnerServiceMock = {
      getClients: vi.fn().mockReturnValue(of({ data: clients } as WebApiResponse<BusinessPartner[]>)),
      addOrUpdateBusinessPartner: vi.fn(),
    };
    driverServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: drivers } as WebApiResponse<Driver[]>)) };
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
      showConfirmation: vi.fn(),
      showNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    tripServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    tripDriverAdded$ = new Subject();
    tripDriverServiceMock = { tripDriverAdded$, add: vi.fn() };
    vehicleServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: vehicles } as WebApiResponse<Vehicle[]>)) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new TripFormComponent(
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      driverServiceMock as unknown as DriverService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      tripServiceMock as unknown as TripService,
      tripDriverServiceMock as unknown as TripDriverService,
      vehicleServiceMock as unknown as VehicleService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function fillValidForm(component: TripFormComponent) {
    component.form.patchValue({
      businessPartnerId: 'bp1',
      businessPartnerName: 'Cliente Um',
    });
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
    it('should build a create-mode form and auto-resolve businessPartnerId from businessPartnerName', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act / Assert
      expect(component.form.get('id')).toBeNull();

      component.form.get('businessPartnerName')!.setValue('Cliente Um');
      expect(component.form.get('businessPartnerId')!.value).toBe('bp1');
    });

    it('should leave businessPartnerId untouched when the name matches no client', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('businessPartnerName')!.setValue('Ninguém');

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBeNull();
    });

    it('should build an edit-mode form with an id control and disable edit-locked fields', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
      expect(component.form.get('tripNumber')!.disabled).toBe(true);
    });

    it('should leave edit-locked fields enabled when adding', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(false);
      expect(component.form.get('tripNumber')!.disabled).toBe(false);
    });

    it('should compute paymentTotalPrice by dividing totalPrice by totalOfPayments when adding', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        totalPrice: 100,
        transaction: { totalOfPayments: 4 },
      } as unknown as Trip;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transaction.paymentTotalPrice')!.value).toBe(25);
    });

    it('should default totalOfPayments to 1 when computing paymentTotalPrice while adding', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        totalPrice: 100,
        transaction: {},
      } as unknown as Trip;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transaction.paymentTotalPrice')!.value).toBe(100);
    });

    it('should use the existing paymentTotalPrice from data when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = {
        totalPrice: 100,
        transaction: { totalOfPayments: 4, paymentTotalPrice: 42 },
      } as unknown as Trip;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transaction.paymentTotalPrice')!.value).toBe(42);
    });

    it('should not throw and skip patching when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act / Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should load vehicles/drivers and build the vehicle plate autocomplete', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual(vehicles);
      expect(component.drivers).toEqual(drivers);

      let result: Vehicle[] = [];
      component.filteredVehiclesByPlate$.subscribe((r) => (result = r));
      component.form.get('vehiclePlate')!.setValue('abc');

      expect(result).toEqual([vehicles[0]]);
    });

    it('should fall back to an empty array of drivers when the response has no data', () => {
      // Arrange
      const component = createComponent();
      driverServiceMock.getAll.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.drivers).toEqual([]);
    });

    it('should fall back to an empty array of vehicles when the response has no data', () => {
      // Arrange
      const component = createComponent();
      vehicleServiceMock.getAll.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual([]);
    });

    it('should not match a vehicle with no model when neither plate nor brand match either', () => {
      // The `||` chain short-circuits once plate/brand matches, so a model-only match never
      // actually evaluates the model fallback - only a non-matching vehicle exercises it.
      // Arrange
      const component = createComponent();
      vehicleServiceMock.getAll.mockReturnValue(
        of({ data: [{ id: 'v9', plate: 'ZZZ0000', brand: 'Renault', model: undefined } as unknown as Vehicle] }),
      );
      component.ngOnInit();

      // Act
      let result: Vehicle[] = [];
      component.filteredVehiclesByPlate$.subscribe((r) => (result = r));
      component.form.get('vehiclePlate')!.setValue('unmatched-term');

      // Assert
      expect(result).toEqual([]);
    });

    it('should add a tripDriver from tripDriverAdded$ and notify success', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      tripDriverAdded$.next({ driverId: 'd1' } as TripDriver);

      // Assert
      expect(component.data!.tripDrivers).toEqual([{ driverId: 'd1' }]);
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        '',
        'TRIPS.DRIVER_ADDED_SUCCESS',
      );
    });

    it('should ignore a falsy tripDriverAdded$ emission', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act / Assert
      expect(() => tripDriverAdded$.next(null as unknown as TripDriver)).not.toThrow();
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should ignore tripDriverAdded$ emissions when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;
      component.ngOnInit();

      // Act / Assert
      expect(() => tripDriverAdded$.next({ driverId: 'd1' } as TripDriver)).not.toThrow();
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should recompute totalPrice whenever price or discount changes', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      component.form.get('price')!.setValue(100);
      component.form.get('discount')!.setValue(10);

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(90);
    });

    it('should recompute totalPrice whenever transaction.totalOfPayments changes', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('price')!.setValue(100);

      // Act
      component.form.get('transaction.totalOfPayments')!.setValue(2);

      // Assert
      expect(component.form.get('transaction.paymentTotalPrice')!.value).toBe(100);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form and rewatch totalOfPayments when data changes after init', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.data = { totalPrice: 200 } as unknown as Trip;

      // Act
      component.ngOnChanges({ data: {} as any });

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(200);
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act / Assert
      expect(() => component.ngOnChanges({ isEdit: {} as any })).not.toThrow();
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;

      // Act / Assert
      expect(() => component.ngOnChanges({ data: {} as any })).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe the totalOfPayments watcher and other tracked subscriptions', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.submitted).toBe(true);
    });

    it('should create a new trip, syncing transaction business partner fields and dropping a null transaction id', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      fillValidForm(component);
      tripServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      const saved = tripServiceMock.add.mock.calls[0][0] as Trip;
      expect(saved.transaction!.businessPartnerId).toBe('bp1');
      expect(saved.transaction!.businessPartnerName).toBe('Cliente Um');
      expect(saved.transaction).not.toHaveProperty('id');
    });

    it('should preserve the existing transaction id when editing a trip that already has one', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 't1', transaction: { id: 'tr1' } } as unknown as Trip;
      component.ngOnInit();
      fillValidForm(component);
      tripServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      const saved = tripServiceMock.update.mock.calls[0][0] as Trip;
      expect(saved.transaction!.id).toBe('tr1');
    });

    it('should not sync transaction business partner fields when the transaction section is hidden', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      fillValidForm(component);
      component.canDisplayTransactionForm = false;
      tripServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      const saved = tripServiceMock.add.mock.calls[0][0] as Trip;
      expect(saved.transaction!.businessPartnerId).toBeUndefined();
    });

    it('should not throw when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      fillValidForm(component);
      component.data = null;
      tripServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
      );

      // Act / Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should notify without saving when the backend reports a business-rule failure', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      fillValidForm(component);
      tripServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<Trip>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      fillValidForm(component);
      tripServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'Erro ao salvar');
    });

    describe('flushStagedTripDrivers', () => {
      it('should save directly via the modal path when there are no staged drivers', () => {
        // Arrange
        const component = createComponent();
        component.isModal = true;
        const dialogRefMock = { close: vi.fn() };
        component.dialogRef = dialogRefMock as any;
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        fillValidForm(component);
        tripServiceMock.add.mockReturnValue(
          of({ status: ResponseStatus.Success, data: { id: 't1' }, message: 'OK' } as WebApiResponse<Trip>),
        );

        // Act
        component.submit().subscribe();

        // Assert
        expect(dialogRefMock.close).toHaveBeenCalled();
        expect(tripDriverServiceMock.add).not.toHaveBeenCalled();
      });

      it('should save directly via the page path when there are no staged drivers', () => {
        // Arrange
        const component = createComponent();
        component.isModal = false;
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        fillValidForm(component);
        tripServiceMock.add.mockReturnValue(
          of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
        );

        // Act
        component.submit().subscribe();

        // Assert
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/trips/t1');
      });

      it('should flush staged trip drivers before finishing when creating with staged drivers and a new id', () => {
        // Arrange
        const component = createComponent();
        component.isModal = false;
        component.data = {
          tripDrivers: [{ driverId: 'd1' } as TripDriver],
        } as unknown as Trip;
        component.ngOnInit();
        fillValidForm(component);
        tripServiceMock.add.mockReturnValue(
          of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
        );
        tripDriverServiceMock.add.mockReturnValue(of({}));

        // Act
        component.submit().subscribe();

        // Assert
        expect(tripDriverServiceMock.add).toHaveBeenCalledWith(
          expect.objectContaining({ driverId: 'd1', tripId: 't1' }),
        );
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/trips/t1');
      });

      it('should not flush staged drivers when editing, even if data has staged drivers', () => {
        // Arrange
        const component = createComponent();
        component.isModal = false;
        component.isEdit = true;
        component.data = {
          id: 't1',
          tripDrivers: [{ driverId: 'd1' } as TripDriver],
        } as unknown as Trip;
        component.ngOnInit();
        fillValidForm(component);
        tripServiceMock.update.mockReturnValue(
          of({ status: ResponseStatus.Success, data: { id: 't1' } } as WebApiResponse<Trip>),
        );

        // Act
        component.submit().subscribe();

        // Assert
        expect(tripDriverServiceMock.add).not.toHaveBeenCalled();
      });

      it('should not flush staged drivers when the response carries no new trip id', () => {
        // Arrange
        const component = createComponent();
        component.isModal = false;
        component.data = {
          tripDrivers: [{ driverId: 'd1' } as TripDriver],
        } as unknown as Trip;
        component.ngOnInit();
        fillValidForm(component);
        tripServiceMock.add.mockReturnValue(
          of({ status: ResponseStatus.Success, data: {} } as unknown as WebApiResponse<Trip>),
        );

        // Act / Assert
        expect(() => component.submit().subscribe()).not.toThrow();
        expect(tripDriverServiceMock.add).not.toHaveBeenCalled();
      });
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
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/trips');
    });
  });

  describe('remove', () => {
    it('should delete and notify success outside a modal when confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 't1' } as Trip;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      tripServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<Trip>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Removido', ResponseStatus.Success);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/trips');
    });

    it('should hide the modal and not navigate when the delete succeeds inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 't1' } as Trip;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      tripServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<Trip>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not navigate when the delete reports an error status', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 't1' } as Trip;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      tripServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<Trip>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should notify an error when the delete request fails', async () => {
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.data = { id: 't1' } as Trip;
        modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
        tripServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        component.remove();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('error', 'Erro ao remover');

        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should reopen the details modal when the deletion is cancelled inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.isEdit = true;
      component.data = { id: 't1' } as Trip;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: true, data: component.data, id: 't1' }),
      );
    });

    it('should do nothing further when the deletion is cancelled outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 't1' } as Trip;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(tripServiceMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('transactionFormGroup', () => {
    it('should return the transaction form group', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act / Assert
      expect(component.transactionFormGroup.get('method')).toBeTruthy();
    });
  });

  describe('onClientBlur', () => {
    it('should clean the selection when the typed name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('   ');

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
      expect(component.form.get('businessPartnerId')!.hasError('required')).toBe(true);
    });

    it('should do nothing further when the typed name matches an existing client', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Cliente Um');

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new client and apply it once created', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Cliente Novo');
      const newClient = { id: 'bp9', name: 'Cliente Novo' } as BusinessPartner;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(newClient) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(businessPartnerServiceMock.addOrUpdateBusinessPartner).toHaveBeenCalledWith(newClient);
      expect(component.form.get('businessPartnerId')!.value).toBe('bp9');
      expect(component.form.get('businessPartnerName')!.value).toBe('Cliente Novo');
    });

    it('should clean the selection when the new-client modal closes without a result', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Cliente Novo');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });

    it('should clean the selection when the user declines creating a new client', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Cliente Novo');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });
  });

  describe('openTripDriverModal', () => {
    it('should open the trip driver modal with the current tripDrivers as parentData', () => {
      // Arrange
      const component = createComponent();
      component.data = { tripDrivers: [{ driverId: 'd1' } as TripDriver] } as unknown as Trip;

      // Act
      component.openTripDriverModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: false, parentData: [{ driverId: 'd1' }] }),
      );
    });

    it('should fall back to an empty array when there is no data yet', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      component.openTripDriverModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentData: [] }),
      );
    });
  });

  describe('selectVehicle', () => {
    it('should do nothing when no vehicle is given', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.selectVehicle(null as unknown as Vehicle)).not.toThrow();
    });

    it('should patch the form with the selected vehicle', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      component.selectVehicle(vehicles[0]);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBe('v1');
      expect(component.form.get('vehiclePlate')!.value).toBe('ABC1234');
    });
  });

  describe('onVehiclePlateBlur', () => {
    it('should clean the selection when the typed plate is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('vehiclePlate')!.setValue('   ');

      // Act
      component.onVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBeNull();
    });

    it('should select the matching vehicle when the plate is found', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('vehiclePlate')!.setValue('ABC1234');

      // Act
      component.onVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBe('v1');
      expect(modalServiceMock.showSweetNotification).not.toHaveBeenCalled();
    });

    it('should warn and clean the selection when the plate matches no vehicle', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('vehiclePlate')!.setValue('NOMATCH');

      // Act
      component.onVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'TRIPS.VEHICLE_NOT_FOUND_TITLE',
        'TRIPS.VEHICLE_NOT_FOUND_MESSAGE',
        'warning',
      );
      expect(component.form.get('vehicleId')!.value).toBeNull();
    });
  });

  describe('openVehiclePickerModal', () => {
    it('should select the picked vehicle', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(vehicles[0]) });

      // Act
      component.openVehiclePickerModal();

      // Assert
      expect(component.form.get('vehicleId')!.value).toBe('v1');
    });

    it('should do nothing when the picker closes without a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act / Assert
      expect(() => component.openVehiclePickerModal()).not.toThrow();
      expect(component.form.get('vehicleId')!.value).toBeNull();
    });
  });

  describe('filteredVehiclesByPlate$', () => {
    it('should match by brand and model as well as plate', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: Vehicle[] = [];
      component.filteredVehiclesByPlate$.subscribe((r) => (result = r));
      component.form.get('vehiclePlate')!.setValue('uno');

      // Assert
      expect(result).toEqual([vehicles[1]]);
    });

    it('should treat a non-string emission as an empty filter', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: Vehicle[] = [];
      component.filteredVehiclesByPlate$.subscribe((r) => (result = r));
      component.form.get('vehiclePlate')!.setValue(vehicles[0] as unknown as string);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('inline trip driver form', () => {
    describe('filteredInlineDriversByName$', () => {
      it('should emit an empty list when there is no filter value', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();

        // Act
        let result: unknown[] = [];
        component.filteredInlineDriversByName$.subscribe((r) => (result = r));

        // Assert
        expect(result).toEqual([]);
      });

      it('should filter by name and flag alreadyUsed/licenseExpired', () => {
        // Arrange
        const component = createComponent();
        component.data = { tripDrivers: [{ driverId: 'd2' } as TripDriver] } as unknown as Trip;
        component.ngOnInit();

        // Act
        let result: any[] = [];
        component.filteredInlineDriversByName$.subscribe((r) => (result = r));
        component.inlineTripDriverForm.get('driverName')!.setValue('maria');

        // Assert
        expect(result).toEqual([
          expect.objectContaining({ id: 'd2', alreadyUsed: true, licenseExpired: true }),
        ]);
      });

      it('should flag a driver with no expiry date as not expired', () => {
        // Arrange
        const component = createComponent();
        driverServiceMock.getAll.mockReturnValue(
          of({
            data: [{ id: 'd9', name: 'Sem Data', licenseExpiryDate: undefined } as unknown as Driver],
          }),
        );
        component.data = {} as unknown as Trip;
        component.ngOnInit();

        // Act
        let result: any[] = [];
        component.filteredInlineDriversByName$.subscribe((r) => (result = r));
        component.inlineTripDriverForm.get('driverName')!.setValue('sem data');

        // Assert
        expect(result).toEqual([expect.objectContaining({ id: 'd9', licenseExpired: false })]);
      });

      it('should treat a driver with no name as an empty string when filtering', () => {
        // Arrange
        const component = createComponent();
        driverServiceMock.getAll.mockReturnValue(
          of({ data: [{ id: 'd9', name: undefined } as unknown as Driver] }),
        );
        component.data = {} as unknown as Trip;
        component.ngOnInit();

        // Act
        let result: any[] = [];
        component.filteredInlineDriversByName$.subscribe((r) => (result = r));
        component.inlineTripDriverForm.get('driverName')!.setValue('anything');

        // Assert
        expect(result).toEqual([]);
      });

      it('should treat a non-string emission as an empty filter', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();

        // Act
        let result: unknown[] = [];
        component.filteredInlineDriversByName$.subscribe((r) => (result = r));
        component.inlineTripDriverForm.get('driverName')!.setValue(drivers[0] as unknown as string);

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('onInlineDriverNameBlur', () => {
      it('should clean the selection when the typed name is blank', () => {
        // Arrange
        vi.useFakeTimers();
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.get('driverName')!.setValue('   ');

        // Act
        component.onInlineDriverNameBlur();
        vi.advanceTimersByTime(200);

        // Assert
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBeNull();
      });

      it('should do nothing further when the typed name matches an existing driver', () => {
        // Arrange
        vi.useFakeTimers();
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.get('driverName')!.setValue('João');

        // Act
        component.onInlineDriverNameBlur();
        vi.advanceTimersByTime(200);

        // Assert
        expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
      });

      it('should offer to create a new driver and select it once created', () => {
        // Arrange
        vi.useFakeTimers();
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.get('driverName')!.setValue('Novo Motorista');
        const newDriver = { id: 'd9', name: 'Novo Motorista', licenseNumber: '999' } as Driver;
        modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
        modalServiceMock.showTemplateModal.mockReturnValue({
          afterClosed: () => of({ data: newDriver } as WebApiResponse<Driver>),
        });

        // Act
        component.onInlineDriverNameBlur();
        vi.advanceTimersByTime(200);

        // Assert
        expect(component.drivers).toContainEqual(newDriver);
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBe('d9');
      });

      it('should clean the selection when the new-driver modal closes without a result', () => {
        // Arrange
        vi.useFakeTimers();
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.get('driverName')!.setValue('Novo Motorista');
        modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
        modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

        // Act
        component.onInlineDriverNameBlur();
        vi.advanceTimersByTime(200);

        // Assert
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBeNull();
      });

      it('should clean the selection when the user declines creating a new driver', () => {
        // Arrange
        vi.useFakeTimers();
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.get('driverName')!.setValue('Novo Motorista');
        modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

        // Act
        component.onInlineDriverNameBlur();
        vi.advanceTimersByTime(200);

        // Assert
        expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBeNull();
      });
    });

    describe('selectInlineTripDriver', () => {
      it('should do nothing when no driver is given', () => {
        // Arrange
        const component = createComponent();

        // Act / Assert
        expect(() => component.selectInlineTripDriver(null as unknown as Driver)).not.toThrow();
      });

      it('should patch the inline form with the selected driver', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();

        // Act
        component.selectInlineTripDriver(drivers[0]);

        // Assert
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBe('d1');
        expect(component.inlineTripDriverForm.get('driverName')!.value).toBe('João');
      });

      it('should warn and clean the selection when the driver was already added', () => {
        // Arrange
        const component = createComponent();
        component.data = { tripDrivers: [{ driverId: 'd1' } as TripDriver] } as unknown as Trip;
        component.ngOnInit();

        // Act
        component.selectInlineTripDriver(drivers[0]);

        // Assert
        expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
          false,
          'TRIPS.DRIVER_ALREADY_ADDED_TITLE',
          'TRIPS.DRIVER_ALREADY_ADDED_MESSAGE',
        );
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBeNull();
      });
    });

    describe('addInlineTripDriver', () => {
      it('should do nothing without a selected driverId', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();

        // Act
        component.addInlineTripDriver();

        // Assert
        expect(component.data!.tripDrivers).toBeUndefined();
      });

      it('should do nothing without data', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.patchValue({ driverId: 'd1', amount: 100 });
        component.data = null;

        // Act / Assert
        expect(() => component.addInlineTripDriver()).not.toThrow();
      });

      it('should append a staged tripDriver and reset the inline form', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.patchValue({
          driverId: 'd1',
          driverName: 'João',
          driverLicenseNumber: '123',
          amount: 100,
        });

        // Act
        component.addInlineTripDriver();

        // Assert
        expect(component.data!.tripDrivers).toEqual([
          expect.objectContaining({ driverId: 'd1', driverName: 'João', amount: 100 }),
        ]);
        expect(component.inlineTripDriverForm.get('driverId')!.value).toBeNull();
      });

      it('should treat a non-numeric amount as zero', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;
        component.ngOnInit();
        component.inlineTripDriverForm.patchValue({ driverId: 'd1', amount: '' });

        // Act
        component.addInlineTripDriver();

        // Assert
        expect(component.data!.tripDrivers![0].amount).toBe(0);
      });
    });

    describe('removeTripDriver', () => {
      it('should do nothing when there are no tripDrivers', () => {
        // Arrange
        const component = createComponent();
        component.data = {} as unknown as Trip;

        // Act / Assert
        expect(() => component.removeTripDriver(0)).not.toThrow();
      });

      it('should remove the tripDriver at the given index', () => {
        // Arrange
        const component = createComponent();
        component.data = {
          tripDrivers: [{ driverId: 'd1' } as TripDriver, { driverId: 'd2' } as TripDriver],
        } as unknown as Trip;

        // Act
        component.removeTripDriver(0);

        // Assert
        expect(component.data!.tripDrivers).toEqual([{ driverId: 'd2' }]);
      });
    });
  });

  describe('filteredBusinessPartners$', () => {
    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should fall back to an empty array of clients when the response has no data', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(of({}));
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));
      component.form.get('businessPartnerName')!.setValue('anything');

      // Assert
      expect(result).toEqual([]);
    });

    it('should treat a client with no name as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(
        of({ data: [{ id: 'bp9', name: undefined } as unknown as BusinessPartner] }),
      );
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));
      component.form.get('businessPartnerName')!.setValue('anything');

      // Assert
      expect(result).toEqual([]);
    });

    it('should filter clients by name case-insensitively', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));
      component.form.get('businessPartnerName')!.setValue('cliente um');

      // Assert
      expect(result).toEqual([clients[0]]);
    });
  });

  describe('addTransactionForm (direct call)', () => {
    it('should not re-add the transaction group when one already exists', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      const existingGroup = component.form.get('transaction');

      // Act
      expect(() => (component as any).addTransactionForm()).not.toThrow();

      // Assert
      expect(component.form.get('transaction')).toBe(existingGroup);
    });
  });

  describe('updateTotalPriceFields', () => {
    it('should not touch the transaction paymentTotalPrice while editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      const before = component.form.get('transaction.paymentTotalPrice')!.value;
      component.form.get('price')!.setValue(500);

      // Act
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.form.get('transaction.paymentTotalPrice')!.value).toBe(before);
    });

    it('should treat a non-numeric price as zero', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.get('price')!.setValue('' as any);

      // Act
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(0);
    });
  });

  describe('setupTotalOfPaymentsWatcher (direct call)', () => {
    it('should not throw when the form has no transaction group', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.form.removeControl('transaction');

      // Act / Assert
      expect(() => (component as any).setupTotalOfPaymentsWatcher()).not.toThrow();
    });

    it('should not throw when the transaction group has no totalOfPayments control', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Trip;
      component.ngOnInit();
      component.transactionFormGroup.removeControl('totalOfPayments');

      // Act / Assert
      expect(() => (component as any).setupTotalOfPaymentsWatcher()).not.toThrow();
    });
  });

  describe('saveModal / savePage (via submit)', () => {
    it('should show a failure notification when saveModal is called with a non-success status', () => {
      // Arrange
      const component = createComponent();
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;

      // Act
      (component as any).saveModal({
        status: ResponseStatus.Error,
        message: 'Falhou',
      } as WebApiResponse<Trip>);

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(false, 'Viagem adicionada', 'Falhou');
    });

    it('should notify and update local data when savePage is called while editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 't1' } as Trip;
      const updated = { id: 't1', tripNumber: 'T-2' } as Trip;

      // Act
      (component as any).savePage({
        status: ResponseStatus.Success,
        message: 'OK',
        data: updated,
      } as WebApiResponse<Trip>);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
      expect(component.data).toBe(updated);
    });
  });
});
