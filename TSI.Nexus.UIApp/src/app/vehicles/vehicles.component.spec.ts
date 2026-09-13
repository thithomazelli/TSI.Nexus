import { ChangeDetectorRef } from '@angular/core';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  Vehicle,
  VehicleService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { VehiclesComponent } from './vehicles.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('VehiclesComponent', () => {
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let vehicleChanged$: Subject<void>;
  let vehicleServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    vehicleChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function mockGridRef(): GridComponent<Vehicle> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Vehicle>;
  }

  function createComponent(): VehiclesComponent {
    modalServiceMock = { showTemplateModal: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    vehicleChanged$ = new Subject();
    vehicleServiceMock = {
      getAllPaged: vi.fn(),
      vehicleChanged$,
      delete: vi.fn(),
      refresh: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new VehiclesComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      vehicleServiceMock as unknown as VehicleService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('constructor', () => {
    it('should build the column defs on construction', () => {
      // Act
      const component = createComponent();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
    });

    it('should rebuild the column defs and mark for check when the language changes', () => {
      // Arrange
      const component = createComponent();
      const before = component.columnDefs;
      cdrMock.markForCheck.mockClear();

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('pagedDataSource', () => {
    it('should delegate to vehicleService.getAllPaged when called', () => {
      // Arrange
      const component = createComponent();
      const request = { page: 1 } as any;
      vehicleServiceMock.getAllPaged.mockReturnValue(of({ data: [], total: 0 }));

      // Act
      component.pagedDataSource(request);

      // Assert
      expect(vehicleServiceMock.getAllPaged).toHaveBeenCalledWith(request);
    });
  });

  describe('ngOnInit', () => {
    it('should purge the grid cache on the second vehicleChanged$ emission, skipping the initial replay', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      vehicleChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();

      // Act
      vehicleChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop reacting to vehicleChanged$ after ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      vehicleChanged$.next();
      vehicleChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
    });

    it('should not throw when called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('openModal', () => {
    it('should open the vehicle details modal with the given initial state', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        { isEdit: false },
      );
    });
  });

  describe('deleteVehicle', () => {
    it('should purge the grid cache and notify when the delete succeeds', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      vehicleServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteVehicle({ id: 'v1' } as Vehicle);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'Removido',
      );
    });

    it('should not purge the grid cache when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      vehicleServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteVehicle({ id: 'v1' } as Vehicle);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falhou',
      );
    });
  });

  describe('refreshVehicles', () => {
    it('should show a success notification when the refresh succeeds', () => {
      // Arrange
      const component = createComponent();
      vehicleServiceMock.refresh.mockReturnValue(of(undefined));

      // Act
      component.refreshVehicles();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'VEHICLES.VEHICLES_REFRESHED',
      );
    });

    it('should show an error notification when the refresh fails', () => {
      // Arrange
      const component = createComponent();
      vehicleServiceMock.refresh.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.refreshVehicles();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'VEHICLES.VEHICLES_REFRESH_ERROR',
      );
    });
  });

  describe('typeMap / statusMap getters', () => {
    it('should expose translated labels for each vehicle type', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.typeMap).toEqual({
        Bus: 'VEHICLES.BUS',
        MiniBus: 'VEHICLES.MINI_BUS',
        Van: 'VEHICLES.VAN',
        Car: 'VEHICLES.CAR',
        Other: 'VEHICLES.OTHER',
      });
    });

    it('should expose translated labels and colors for each status', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.statusMap['Available']).toEqual({ label: 'VEHICLES.STATUS_AVAILABLE', color: 'success' });
      expect(component.statusMap['InMaintenance']).toEqual({ label: 'VEHICLES.STATUS_IN_MAINTENANCE', color: 'warning' });
      expect(component.statusMap['Blocked']).toEqual({ label: 'VEHICLES.STATUS_BLOCKED', color: 'danger' });
      expect(component.statusMap['Inactive']).toEqual({ label: 'VEHICLES.STATUS_INACTIVE', color: 'secondary' });
    });
  });

  describe('column defs', () => {
    it('should render the plate value as a link', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'plate')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'ABC1234' } as any);

      // Assert
      expect(html).toContain('ABC1234');
    });

    it('should translate the type and fall back to the raw value when unmapped', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act / Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 'Van' } as any)).toBe('VEHICLES.VAN');
      expect((column.valueFormatter as (p: any) => string)({ value: 'Bogus' } as any)).toBe('Bogus');
    });

    it('should render the status badge with the mapped color and label', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'Available' } as any);

      // Assert
      expect(html).toContain('bg-success');
      expect(html).toContain('VEHICLES.STATUS_AVAILABLE');
    });

    it('should fall back to a secondary badge for an unknown status', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'Unknown' } as any);

      // Assert
      expect(html).toContain('bg-secondary');
      expect(html).toContain('Unknown');
    });

    it('should format pricePerKm and dailyRate as BRL currency', () => {
      // Arrange
      const component = createComponent();
      const priceColumn = component.columnDefs.find((c) => c.field === 'pricePerKm')!;
      const dailyColumn = component.columnDefs.find((c) => c.field === 'dailyRate')!;

      // Act / Assert
      expect((priceColumn.valueFormatter as (p: any) => string)({ value: 2.5 } as any)).toContain('R$');
      expect((dailyColumn.valueFormatter as (p: any) => string)({ value: 200 } as any)).toContain('R$');
    });

    it('should render the actions column with view, edit and delete buttons', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as (p: any) => string)({} as any);

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
