import { ChangeDetectorRef } from '@angular/core';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  VehicleMaintenance,
  VehicleMaintenanceService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of } from 'rxjs';
import { GridComponent } from '../../../shared/grid/grid.component';
import { VehicleMaintenanceListComponent } from './vehicle-maintenance-list.component';

describe('VehicleMaintenanceListComponent', () => {
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn>; hideModal: ReturnType<typeof vi.fn>; showSweetNotification: ReturnType<typeof vi.fn> };
  let maintenanceChanged$: Subject<void>;
  let vehicleMaintenanceServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    getByVehicle: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    maintenanceChanged$: Subject<void>;
  };
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function mockGridRef(): GridComponent<VehicleMaintenance> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<VehicleMaintenance>;
  }

  function createComponent(): VehicleMaintenanceListComponent {
    notificationServiceMock = { showMessage: vi.fn() };
    modalServiceMock = { showTemplateModal: vi.fn(), hideModal: vi.fn(), showSweetNotification: vi.fn() };
    maintenanceChanged$ = new Subject();
    vehicleMaintenanceServiceMock = {
      getAllPaged: vi.fn(),
      getAll: vi.fn().mockReturnValue(of({ data: [] })),
      getByVehicle: vi.fn().mockReturnValue(of({ data: [] })),
      delete: vi.fn(),
      maintenanceChanged$,
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new VehicleMaintenanceListComponent(
      notificationServiceMock as unknown as NotificationService,
      vehicleMaintenanceServiceMock as unknown as VehicleMaintenanceService,
      modalServiceMock as unknown as ModalService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should return true when there is no vehicleId', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.isTopLevelList).toBe(true);
    });

    it('should return false when a vehicleId is provided', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Assert
      expect(component.isTopLevelList).toBe(false);
    });
  });

  describe('statusMap', () => {
    it('should expose all statuses with their translated labels and colors', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.statusMap['Scheduled']).toEqual({ label: 'VEHICLES.MAINTENANCE_SCHEDULED', color: 'info' });
      expect(component.statusMap['InProgress']).toEqual({ label: 'VEHICLES.MAINTENANCE_IN_PROGRESS', color: 'warning' });
      expect(component.statusMap['Completed']).toEqual({ label: 'VEHICLES.MAINTENANCE_COMPLETED', color: 'success' });
      expect(component.statusMap['Overdue']).toEqual({ label: 'VEHICLES.MAINTENANCE_OVERDUE', color: 'danger' });
      expect(component.statusMap['Cancelled']).toEqual({ label: 'VEHICLES.MAINTENANCE_CANCELLED', color: 'secondary' });
    });
  });

  describe('pagedDataSource', () => {
    it('should delegate to vehicleMaintenanceService.getAllPaged when called', () => {
      // Arrange
      const component = createComponent();
      const request = { page: 1 } as any;
      vehicleMaintenanceServiceMock.getAllPaged.mockReturnValue(of({ data: [], total: 0 }));

      // Act
      component.pagedDataSource(request);

      // Assert
      expect(vehicleMaintenanceServiceMock.getAllPaged).toHaveBeenCalledWith(request);
    });
  });

  describe('ngOnInit', () => {
    it('should build the column defs and not load eagerly for the top-level list', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(vehicleMaintenanceServiceMock.getAll).not.toHaveBeenCalled();
      expect(vehicleMaintenanceServiceMock.getByVehicle).not.toHaveBeenCalled();
    });

    it('should load eagerly when embedded for a specific vehicle', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleMaintenanceServiceMock.getByVehicle).toHaveBeenCalledWith('v1');
    });

    it('should rebuild the column defs and mark for check when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;
      cdrMock.markForCheck.mockClear();

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should purge the grid cache on maintenanceChanged$ for the top-level list', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      maintenanceChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should not throw when maintenanceChanged$ fires without a gridRef', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Assert
      expect(() => maintenanceChanged$.next()).not.toThrow();
    });

    it('should reload when embedded and maintenanceChanged$ fires', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.ngOnInit();
      vehicleMaintenanceServiceMock.getByVehicle.mockClear();

      // Act
      maintenanceChanged$.next();

      // Assert
      expect(vehicleMaintenanceServiceMock.getByVehicle).toHaveBeenCalledWith('v1');
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when vehicleId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v2';

      // Act
      component.ngOnChanges({ vehicleId: { firstChange: false } as any });

      // Assert
      expect(vehicleMaintenanceServiceMock.getByVehicle).toHaveBeenCalledWith('v2');
    });

    it('should not reload on the first change', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v2';

      // Act
      component.ngOnChanges({ vehicleId: { firstChange: true } as any });

      // Assert
      expect(vehicleMaintenanceServiceMock.getByVehicle).not.toHaveBeenCalled();
    });

    it('should load via getAll when vehicleId changes back to undefined', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = undefined;

      // Act
      component.ngOnChanges({ vehicleId: { firstChange: false } as any });

      // Assert
      expect(vehicleMaintenanceServiceMock.getAll).toHaveBeenCalled();
      expect(vehicleMaintenanceServiceMock.getByVehicle).not.toHaveBeenCalled();
    });

    it('should do nothing when vehicleId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(vehicleMaintenanceServiceMock.getByVehicle).not.toHaveBeenCalled();
      expect(vehicleMaintenanceServiceMock.getAll).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop reacting to language changes and maintenanceChanged$ when destroyed', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      const before = component.columnDefs;
      language$.next('en');
      maintenanceChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should use the initialState data vehicleId when present', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.openModal({ data: { id: 'm1', vehicleId: 'other-vehicle' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ vehicleId: 'other-vehicle' }),
      );
    });

    it('should fall back to the component vehicleId when initialState has none', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.openModal({});

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ vehicleId: 'v1' }),
      );
    });
  });

  describe('deleteMaintenance', () => {
    it('should purge the grid cache when the delete succeeds for the top-level list', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      vehicleMaintenanceServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteMaintenance({ id: 'm1' } as VehicleMaintenance);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should remove the row locally and mark for check when the delete succeeds while embedded for a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.rowData = [{ id: 'm1' } as VehicleMaintenance, { id: 'm2' } as VehicleMaintenance];
      vehicleMaintenanceServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteMaintenance({ id: 'm1' } as VehicleMaintenance);

      // Assert
      expect(component.rowData).toEqual([{ id: 'm2' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not purge the cache or filter rows when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.rowData = [{ id: 'm1' } as VehicleMaintenance];
      vehicleMaintenanceServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteMaintenance({ id: 'm1' } as VehicleMaintenance);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(component.rowData).toEqual([{ id: 'm1' }]);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Falhou', ResponseStatus.Error);
    });
  });

  describe('refresh', () => {
    it('should show a notification without reloading for the top-level list', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'VEHICLES.MAINTENANCES_REFRESHED',
      );
      expect(vehicleMaintenanceServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should reload with the refresh notification when embedded for a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      vehicleMaintenanceServiceMock.getByVehicle.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Atualizado', data: [] }),
      );

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Atualizado');
    });
  });

  describe('load (private, via ngOnInit/refresh)', () => {
    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      vehicleMaintenanceServiceMock.getByVehicle.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      vehicleMaintenanceServiceMock.getByVehicle.mockReturnValue({
        pipe: () => ({
          subscribe: (observer: any) => observer.error(new Error('fail')),
        }),
      } as any);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('column defs', () => {
    it('should render description as a link', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'description')!;

      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Troca de óleo' } as any)).toContain('Troca de óleo');
      expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toContain('></a>');
    });

    it('should render vehicle.plate as a link and hide the column when embedded', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'vehicle.plate')!;

      // Assert
      expect(column.hide).toBe(true);
      expect((column.cellRenderer as (p: any) => string)({ value: 'ABC-1234' } as any)).toContain('ABC-1234');
      expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toContain('></a>');
    });

    it('should show the vehicle.plate column for the top-level list', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'vehicle.plate')!;

      // Assert
      expect(column.hide).toBe(false);
    });

    describe('type column', () => {
      it('should render Preventive with the correct translated label', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'type')!;

        // Assert
        expect((column.cellRenderer as (p: any) => string)({ value: 'Preventive' } as any)).toContain('VEHICLES.PREVENTIVE');
      });

      it('should render any non-Preventive value as Corrective', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'type')!;

        // Assert
        expect((column.cellRenderer as (p: any) => string)({ value: 'Corrective' } as any)).toContain('VEHICLES.CORRECTIVE');
        expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toContain('VEHICLES.CORRECTIVE');
      });
    });

    it('should format scheduledDate as a BR date', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'scheduledDate')!;

      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any)).toContain('/');
    });

    it('should format cost as BRL currency', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'cost')!;

      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 250 } as any)).toContain('R$');
    });

    describe('status column', () => {
      it.each([
        ['Scheduled', 'info', 'VEHICLES.MAINTENANCE_SCHEDULED'],
        ['InProgress', 'warning', 'VEHICLES.MAINTENANCE_IN_PROGRESS'],
        ['Completed', 'success', 'VEHICLES.MAINTENANCE_COMPLETED'],
        ['Overdue', 'danger', 'VEHICLES.MAINTENANCE_OVERDUE'],
        ['Cancelled', 'secondary', 'VEHICLES.MAINTENANCE_CANCELLED'],
      ])('should render status %s with the %s color and translated label', (status, color, label) => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'status')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: status } as any);

        // Assert
        expect(html).toContain(`bg-${color}`);
        expect(html).toContain(label);
      });

      it('should fall back to a secondary badge with the raw value for an unknown status', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'status')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: 'Unknown' } as any);

        // Assert
        expect(html).toContain('bg-secondary');
        expect(html).toContain('Unknown');
      });
    });

    it('should render the actions column with view, edit and delete buttons', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
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
