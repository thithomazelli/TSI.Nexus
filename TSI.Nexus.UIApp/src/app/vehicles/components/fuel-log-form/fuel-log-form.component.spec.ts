import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  FuelLog,
  FuelLogService,
  ModalService,
  NotificationService,
  Product,
  ProductService,
  ResponseStatus,
  SelectableOptionService,
  TranslationService,
  Vehicle,
  VehicleService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { FuelLogFormComponent } from './fuel-log-form.component';

describe('FuelLogFormComponent', () => {
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showConfirmation: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let fuelLogServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let productServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let vehicleServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let selectableOptionServiceMock: { getByGroup: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const vehicles: Vehicle[] = [
    { id: 'v1', plate: 'ABC1234' } as Vehicle,
    { id: 'v2', plate: 'XYZ9876' } as Vehicle,
  ];
  const products: Product[] = [
    { id: 'p1', sku: 'SKU1', name: 'Diesel S10' } as Product,
    { id: 'p2', sku: 'SKU2', name: 'Gasolina' } as Product,
  ];

  function createComponent(): FuelLogFormComponent {
    modalServiceMock = {
      hideModal: vi.fn(),
      showConfirmation: vi.fn(),
      showTemplateModal: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    fuelLogServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    productServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: products } as WebApiResponse<Product[]>)),
    };
    vehicleServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: vehicles } as WebApiResponse<Vehicle[]>)),
    };
    selectableOptionServiceMock = { getByGroup: vi.fn().mockReturnValue(of({ data: [] })) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new FuelLogFormComponent(
      new FormBuilder(),
      fuelLogServiceMock as unknown as FuelLogService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      productServiceMock as unknown as ProductService,
      routerMock as unknown as Router,
      selectableOptionServiceMock as unknown as SelectableOptionService,
      translationServiceMock as unknown as TranslationService,
      vehicleServiceMock as unknown as VehicleService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function fillValidForm(component: FuelLogFormComponent) {
    component.form.patchValue({
      date: '2024-01-01',
      odometer: 1000,
      liters: 40,
      pricePerLiter: 5,
      status: 'Open',
      vehicleId: 'v1',
    });
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load vehicles and build the vehicle autocomplete when no vehicleId is pre-set', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual(vehicles);
      expect(cdrMock.markForCheck).toHaveBeenCalled();

      let result: Vehicle[] = [];
      component.filteredVehiclesPlate$.subscribe((r) => (result = r));
      component.form.get('vehiclePlate')!.setValue('abc');

      expect(result).toEqual([vehicles[0]]);
    });

    it('should not fetch vehicles when embedded with a pre-set vehicleId', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleServiceMock.getAll).not.toHaveBeenCalled();
      expect(component.form.get('vehicleId')!.value).toBe('v1');
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

    it('should fall back to an empty status options array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.statusOptions).toEqual([]);
    });

    it('should load status options from the response data when the response has data', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(
        of({ data: [{ id: 's1', name: 'Open' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.statusOptions).toEqual([{ id: 's1', name: 'Open' }]);
    });

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

    it('should patch the form with the provided data including the vehicle plate when data has a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        odometer: 500,
        vehicle: { plate: 'ABC1234' },
      } as FuelLog;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('odometer')!.value).toBe(500);
      expect(component.form.get('vehiclePlate')!.value).toBe('ABC1234');
    });

    it('should not patch the vehicle plate when the data has no vehicle', () => {
      // Arrange
      const component = createComponent();
      component.data = { odometer: 500 } as FuelLog;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('vehiclePlate')!.value).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form when data changes after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { odometer: 999 } as FuelLog;

      // Act
      component.ngOnChanges({ data: { currentValue: component.data } as never });

      // Assert
      expect(component.form.get('odometer')!.value).toBe(999);
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: { currentValue: true } as never });

      // Assert
      expect(component.form.get('odometer')!.value).toBe(0);
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
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({ data: { currentValue: { odometer: 1 } } as never }),
      ).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when unsubscribing tracked subscriptions', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onProductSkuBlur', () => {
    it('should clean the selection when the typed sku is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('productSku')!.setValue('   ');

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productSku')!.value).toBe('');
      expect(component.form.get('productId')!.value).toBeNull();
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should select the matching product without prompting when the sku is found', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      (component as any)._products = products;
      component.form.get('productSku')!.setValue('SKU1');

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('p1');
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new product when the sku is not found', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      (component as any)._products = products;
      component.form.get('productSku')!.setValue('SKU-NEW');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });
  });

  describe('onProductNameBlur', () => {
    it('should clean the selection when the typed name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('productName')!.setValue('   ');

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productName')!.value).toBe('');
    });

    it('should select the matching product without prompting when the name is found', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      (component as any)._products = products;
      component.form.get('productName')!.setValue('Diesel S10');

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('p1');
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new product when the name is not found', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      (component as any)._products = products;
      component.form.get('productName')!.setValue('Produto Novo');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });
  });

  describe('confirmAndCreateProduct (via blur)', () => {
    it('should do nothing further when the user declines creating a new product', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU-NEW');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('productSku')!.value).toBe('');
    });

    it('should add and select the newly created product when the user confirms creation', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU-NEW');
      const newProduct = { id: 'p9', sku: 'SKU-NEW', name: 'Novo' } as Product;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({
        afterClosed: () => of({ data: newProduct } as WebApiResponse<Product>),
      });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('p9');
      expect((component as any)._products).toContainEqual(newProduct);
    });

    it('should clean the selection when the new-product modal closes without a result', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU-NEW');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productSku')!.value).toBe('');
    });

    it('should resolve the entity name from data.name when there is no sku', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('productName')!.setValue('Produto Sem SKU');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });
  });

  describe('selectProduct', () => {
    it('should do nothing when no product is given', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.selectProduct(null as unknown as Product)).not.toThrow();
    });

    it('should patch the form with the selected product', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.selectProduct(products[0]);

      // Assert
      expect(component.form.get('productId')!.value).toBe('p1');
      expect(component.form.get('productSku')!.value).toBe('SKU1');
      expect(component.form.get('productName')!.value).toBe('Diesel S10');
    });
  });

  describe('onVehiclePlateBlur', () => {
    it('should clean the selection when the typed plate is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('vehiclePlate')!.setValue('   ');

      // Act
      component.onVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBeNull();
      expect(component.form.get('vehiclePlate')!.value).toBe('');
    });

    it('should select the matching vehicle when the plate is found', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('vehiclePlate')!.setValue('ABC1234');

      // Act
      component.onVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBe('v1');
    });

    it('should clean the selection when the typed plate matches no vehicle', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('vehiclePlate')!.setValue('NOMATCH');

      // Act
      component.onVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBeNull();
    });
  });

  describe('selectVehicle', () => {
    it('should do nothing when no vehicle is given', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.selectVehicle(null as unknown as Vehicle)).not.toThrow();
    });

    it('should patch the form with the selected vehicle', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.selectVehicle(vehicles[0]);

      // Assert
      expect(component.form.get('vehicleId')!.value).toBe('v1');
      expect(component.form.get('vehiclePlate')!.value).toBe('ABC1234');
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
      expect(component.form.get('date')!.touched).toBe(true);
      expect(fuelLogServiceMock.add).not.toHaveBeenCalled();
    });

    it('should compute totalCost and use the embedded vehicleId when it is present', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.ngOnInit();
      fillValidForm(component);
      fuelLogServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'f1' } } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(fuelLogServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ totalCost: 200, vehicleId: 'v1' }),
      );
    });

    it('should set product fields to null when no product was selected', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      fuelLogServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'f1' } } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(fuelLogServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ productId: null, productSku: null, productName: null }),
      );
    });

    it('should include product fields when a product was selected', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      component.selectProduct(products[0]);
      fuelLogServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'f1' } } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(fuelLogServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'p1', productSku: 'SKU1', productName: 'Diesel S10' }),
      );
    });

    it('should update when editing an existing record', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'f1' } as FuelLog;
      component.ngOnInit();
      fillValidForm(component);
      fuelLogServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'f1' } } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(fuelLogServiceMock.update).toHaveBeenCalled();
    });

    it('should notify without saving when the backend reports a failure status', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      fuelLogServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
    });

    it('should save via the modal path when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.ngOnInit();
      fillValidForm(component);
      fuelLogServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'f1' }, message: 'OK' } as WebApiResponse<FuelLog>),
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
      fuelLogServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'f1' } } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/fuel-logs');
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      fuelLogServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Erro ao salvar o abastecimento.',
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
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/fuel-logs');
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
      expect(fuelLogServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should delete, notify and navigate when the deletion succeeds outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'f1' } as FuelLog;
      fuelLogServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<FuelLog>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Removido');
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/fuel-logs');
    });

    it('should hide the modal and not navigate when the deletion succeeds inside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'f1' } as FuelLog;
      fuelLogServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<FuelLog>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not navigate when the delete reports an error status', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'f1' } as FuelLog;
      fuelLogServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<FuelLog>),
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
        component.data = { id: 'f1' } as FuelLog;
        fuelLogServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        component.remove();
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          ResponseStatus.Error,
          'Erro ao remover o abastecimento.',
        );
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });
  });

  describe('savePage (via submit)', () => {
    it('should notify and update local data when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'f1' } as FuelLog;
      component.ngOnInit();
      fillValidForm(component);
      const updated = { id: 'f1', odometer: 999 } as FuelLog;
      fuelLogServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: updated } as WebApiResponse<FuelLog>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
      expect(component.data).toBe(updated);
    });

    it('should notify without navigating when adding fails with a non-success status', () => {
      // Arrange
      const component = createComponent();

      // Act
      (component as any).savePage({
        status: ResponseStatus.Error,
        message: 'Falhou',
      } as WebApiResponse<FuelLog>);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('filteredProductsSku$ / filteredProductsName$', () => {
    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should filter products by sku and name case-insensitively when a matching value is set', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.form.get('productSku')!.setValue('sku1');
      component.form.get('productName')!.setValue('diesel');

      // Assert
      expect(sku).toEqual([products[0]]);
      expect(name).toEqual([products[0]]);
    });

    it('should fall back to an empty product array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(of({}));
      component.ngOnInit();

      let sku: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));

      // Act
      component.form.get('productSku')!.setValue('sku1');

      // Assert
      expect(sku).toEqual([]);
    });

    it('should treat a non-string emission as an empty filter', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.form.get('productSku')!.setValue(123 as unknown as string);
      component.form.get('productName')!.setValue(123 as unknown as string);

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should treat a product with no sku or name as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(
        of({ data: [{ id: 'p9', sku: undefined, name: undefined } as unknown as Product] }),
      );
      component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.form.get('productSku')!.setValue('anything');
      component.form.get('productName')!.setValue('anything');

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });
  });

  describe('filteredVehiclesPlate$', () => {
    it('should treat a non-string emission as an empty filter', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: Vehicle[] = [];
      component.filteredVehiclesPlate$.subscribe((r) => (result = r));

      // Act
      component.form.get('vehiclePlate')!.setValue(123 as unknown as string);

      // Assert
      expect(result).toEqual([]);
    });

    it('should treat a vehicle with no plate as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      vehicleServiceMock.getAll.mockReturnValue(
        of({ data: [{ id: 'v9', plate: undefined } as unknown as Vehicle] }),
      );
      component.ngOnInit();

      let result: Vehicle[] = [];
      component.filteredVehiclesPlate$.subscribe((r) => (result = r));

      // Act
      component.form.get('vehiclePlate')!.setValue('anything');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('confirmAndCreateProduct (direct call)', () => {
    it('should resolve the entity name to an empty string when neither sku nor name is given', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      // Assert
      expect(() => (component as any).confirmAndCreateProduct({})).not.toThrow();

      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });
  });

  describe('date helpers (via submit)', () => {
    function submitWithDate(date: unknown) {
      const component = createComponent();
      component.vehicleId = 'v1';
      component.ngOnInit();
      fillValidForm(component);
      component.form.get('date')!.setValue(date);
      let payload: any;
      fuelLogServiceMock.add.mockImplementation((fuelLog: FuelLog) => {
        payload = fuelLog;
        return of({ status: ResponseStatus.Success, data: { id: 'f1' } } as WebApiResponse<FuelLog>);
      });
      component.submit().subscribe();
      return payload;
    }

    it('should fall back to the current date when none is given', () => {
      // Arrange
      // date is a required field, so submit() can never reach toDate() with an empty value
      // through the public flow - exercised directly to cover the defensive branch.
      const component = createComponent();

      // Act
      // Assert
      expect((component as any).toDate('')).toBeInstanceOf(Date);
      expect((component as any).toDate(null)).toBeInstanceOf(Date);
    });

    it('should parse an object with its own toDate() method', () => {
      // Arrange
      const fakeMoment = { toDate: () => new Date(2099, 0, 2) };

      // Act
      const payload = submitWithDate(fakeMoment);

      // Assert
      expect(payload.date.getDate()).toBe(2);
    });

    it('should return a Date instance unchanged when the date is already a Date', () => {
      // Arrange
      const date = new Date(2099, 0, 1);

      // Act
      const payload = submitWithDate(date);

      // Assert
      expect(payload.date).toBe(date);
    });

    it('should parse a dd/mm/yyyy string when the date is given in that format', () => {
      // Act
      const payload = submitWithDate('15/03/2099');

      // Assert
      expect(payload.date.getFullYear()).toBe(2099);
      expect(payload.date.getMonth()).toBe(2);
      expect(payload.date.getDate()).toBe(15);
    });

    it('should fall back to day=1 and month=1 when the dd/mm/yyyy parts are zero', () => {
      // Act
      const payload = submitWithDate('0/0/2099');

      // Assert
      expect(payload.date.getMonth()).toBe(0);
      expect(payload.date.getDate()).toBe(1);
    });

    it('should parse an ISO-like string when there are no slashes', () => {
      // Act
      const payload = submitWithDate('2099-03-15');

      // Assert
      expect(payload.date.getFullYear()).toBe(2099);
    });
  });
});
