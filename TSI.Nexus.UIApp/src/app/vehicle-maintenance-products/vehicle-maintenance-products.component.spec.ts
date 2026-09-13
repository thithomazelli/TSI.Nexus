import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  VehicleMaintenanceProduct,
  VehicleMaintenanceProductService,
} from '@nexus/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { VehicleMaintenanceProductsComponent } from './vehicle-maintenance-products.component';

describe('VehicleMaintenanceProductsComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let vehicleMaintenanceProductChanged$: Subject<void>;
  let vehicleMaintenanceProductServiceMock: {
    getByEntityId: ReturnType<typeof vi.fn>;
    vehicleMaintenanceProductChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): VehicleMaintenanceProductsComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    vehicleMaintenanceProductChanged$ = new Subject();
    vehicleMaintenanceProductServiceMock = {
      getByEntityId: vi.fn().mockReturnValue(of({ data: [] })),
      vehicleMaintenanceProductChanged$,
      delete: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new VehicleMaintenanceProductsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      vehicleMaintenanceProductServiceMock as unknown as VehicleMaintenanceProductService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the column defs and load the products when initialized', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).toHaveBeenCalledWith(
        'vm1',
        'VehicleMaintenance',
      );
    });

    it('should rebuild the column defs and mark for check when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should reload when vehicleMaintenanceProductChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';
      component.ngOnInit();
      vehicleMaintenanceProductServiceMock.getByEntityId.mockClear();

      // Act
      vehicleMaintenanceProductChanged$.next();

      // Assert
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).toHaveBeenCalledWith(
        'vm1',
        'VehicleMaintenance',
      );
    });

    it('should stop reacting to language/vehicleMaintenanceProductChanged$ when ngOnDestroy has run', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;
      vehicleMaintenanceProductServiceMock.getByEntityId.mockClear();

      // Act
      language$.next('en');
      vehicleMaintenanceProductChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when parentId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm2';

      // Act
      component.ngOnChanges({ parentId: { firstChange: false } as any });

      // Assert
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).toHaveBeenCalledWith(
        'vm2',
        'VehicleMaintenance',
      );
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm2';

      // Act
      component.ngOnChanges({ parentId: { firstChange: true } as any });

      // Assert
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });

    it('should do nothing when parentId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should use the vehicleMaintenanceId from the initial data when present', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';

      // Act
      component.openModal({ isEdit: true, data: { vehicleMaintenanceId: 'vm-from-data' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'vm-from-data' }),
      );
    });

    it('should fall back to the component parentId when the initial data has none', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';

      // Act
      component.openModal({ isEdit: false, data: {} });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'vm1' }),
      );
    });
  });

  describe('refresh', () => {
    it('should reload and show a success notification when refresh is called', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'VEHICLE_MAINTENANCE_PRODUCTS.VEHICLE_MAINTENANCE_PRODUCTS_REFRESHED',
      );
    });
  });

  describe('noop', () => {
    it('should do nothing when noop is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.noop()).not.toThrow();
    });
  });

  describe('deleteVehicleMaintenanceProduct', () => {
    it('should remove the product from the grid, notify with the response status, and mark for check when deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [
        { id: 'x1' } as VehicleMaintenanceProduct,
        { id: 'x2' } as VehicleMaintenanceProduct,
      ];
      vehicleMaintenanceProductServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteVehicleMaintenanceProduct({ id: 'x1' } as VehicleMaintenanceProduct);

      // Assert
      expect(component.rowData).toEqual([{ id: 'x2' }]);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'VEHICLE_MAINTENANCE_PRODUCTS.ITEM_DELETED',
        'Removido',
        ResponseStatus.Success,
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('load (private, via ngOnInit)', () => {
    it('should do nothing when there is no parentId', () => {
      // Arrange
      const component = createComponent();
      component.parentId = null;

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleMaintenanceProductServiceMock.getByEntityId).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array and mark for check when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';
      vehicleMaintenanceProductServiceMock.getByEntityId.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should stop loading and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'vm1';
      vehicleMaintenanceProductServiceMock.getByEntityId.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('column defs cell renderers', () => {
    it('should render the productSku as a link and fall back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'productSku')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'SKU1' })).toContain('SKU1');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should render the productName as a link and fall back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'productName')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Produto A' })).toContain(
        'Produto A',
      );
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should format totalPrice as BRL currency and fall back to R$ 0,00 when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'totalPrice')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 12.5 } as any)).toBe(
        'R$ 12.50',
      );
      expect((column.valueFormatter as (p: any) => string)({ value: 0 } as any)).toBe('R$ 0,00');
      expect((column.valueFormatter as (p: any) => string)({ value: null } as any)).toBe(
        'R$ 0,00',
      );
    });

    it('should render the actions column buttons when the cell renderer runs', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
