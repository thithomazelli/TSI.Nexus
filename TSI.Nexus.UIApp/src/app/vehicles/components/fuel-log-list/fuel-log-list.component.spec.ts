import {
  FuelLog,
  FuelLogService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of } from 'rxjs';
import { GridComponent } from '../../../shared/grid/grid.component';
import { FuelLogListComponent } from './fuel-log-list.component';

describe('FuelLogListComponent', () => {
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn>; hideModal: ReturnType<typeof vi.fn>; showSweetNotification: ReturnType<typeof vi.fn> };
  let fuelLogChanged$: Subject<void>;
  let fuelLogServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    getByVehicle: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    fuelLogChanged$: Subject<void>;
  };
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };

  function mockGridRef(): GridComponent<FuelLog> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<FuelLog>;
  }

  function createComponent(): FuelLogListComponent {
    notificationServiceMock = { showMessage: vi.fn() };
    modalServiceMock = { showTemplateModal: vi.fn(), hideModal: vi.fn(), showSweetNotification: vi.fn() };
    fuelLogChanged$ = new Subject();
    fuelLogServiceMock = {
      getAllPaged: vi.fn(),
      getAll: vi.fn().mockReturnValue(of({ data: [] })),
      getByVehicle: vi.fn().mockReturnValue(of({ data: [] })),
      delete: vi.fn(),
      fuelLogChanged$,
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new FuelLogListComponent(
      notificationServiceMock as unknown as NotificationService,
      fuelLogServiceMock as unknown as FuelLogService,
      modalServiceMock as unknown as ModalService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should return true when there is no vehicleId', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(true);
    });

    it('should return false when a vehicleId is provided', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(false);
    });
  });

  describe('pagedDataSource', () => {
    it('should delegate to fuelLogService.getAllPaged when called', () => {
      // Arrange
      const component = createComponent();
      const request = { page: 1 } as any;
      fuelLogServiceMock.getAllPaged.mockReturnValue(of({ data: [], total: 0 }));

      // Act
      component.pagedDataSource(request);

      // Assert
      expect(fuelLogServiceMock.getAllPaged).toHaveBeenCalledWith(request);
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
      expect(fuelLogServiceMock.getAll).not.toHaveBeenCalled();
      expect(fuelLogServiceMock.getByVehicle).not.toHaveBeenCalled();
    });

    it('should load eagerly when embedded for a specific vehicle', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.ngOnInit();

      // Assert
      expect(fuelLogServiceMock.getByVehicle).toHaveBeenCalledWith('v1');
    });

    it('should rebuild the column defs when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
    });

    it('should purge the grid cache when fuelLogChanged$ fires for the top-level list', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      fuelLogChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should not throw when fuelLogChanged$ fires without a gridRef', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => fuelLogChanged$.next()).not.toThrow();
    });

    it('should reload when embedded and fuelLogChanged$ fires', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.ngOnInit();
      fuelLogServiceMock.getByVehicle.mockClear();

      // Act
      fuelLogChanged$.next();

      // Assert
      expect(fuelLogServiceMock.getByVehicle).toHaveBeenCalledWith('v1');
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
      expect(fuelLogServiceMock.getByVehicle).toHaveBeenCalledWith('v2');
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v2';

      // Act
      component.ngOnChanges({ vehicleId: { firstChange: true } as any });

      // Assert
      expect(fuelLogServiceMock.getByVehicle).not.toHaveBeenCalled();
    });

    it('should load via getAll when vehicleId changes back to undefined', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = undefined;

      // Act
      component.ngOnChanges({ vehicleId: { firstChange: false } as any });

      // Assert
      expect(fuelLogServiceMock.getAll).toHaveBeenCalled();
      expect(fuelLogServiceMock.getByVehicle).not.toHaveBeenCalled();
    });

    it('should do nothing when vehicleId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(fuelLogServiceMock.getByVehicle).not.toHaveBeenCalled();
      expect(fuelLogServiceMock.getAll).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop reacting to language changes and fuelLogChanged$ after ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      const before = component.columnDefs;
      language$.next('en');
      fuelLogChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should open the details modal and always force the component vehicleId', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';

      // Act
      component.openModal({ data: { id: 'f1', vehicleId: 'other-vehicle' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ vehicleId: 'v1', data: { id: 'f1', vehicleId: 'other-vehicle' } }),
      );
    });
  });

  describe('removeFuelLog', () => {
    it('should purge the grid cache on success for the top-level list', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      fuelLogServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.removeFuelLog({ id: 'f1' } as FuelLog);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should remove the row locally on success when embedded for a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.rowData = [{ id: 'f1' } as FuelLog, { id: 'f2' } as FuelLog];
      fuelLogServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.removeFuelLog({ id: 'f1' } as FuelLog);

      // Assert
      expect(component.rowData).toEqual([{ id: 'f2' }]);
    });

    it('should not purge or filter rows when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.rowData = [{ id: 'f1' } as FuelLog];
      fuelLogServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.removeFuelLog({ id: 'f1' } as FuelLog);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(component.rowData).toEqual([{ id: 'f1' }]);
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
        'VEHICLES.FUEL_LOGS_REFRESHED',
      );
      expect(fuelLogServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should reload with the refresh notification when embedded for a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      fuelLogServiceMock.getByVehicle.mockReturnValue(
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
      fuelLogServiceMock.getByVehicle.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      fuelLogServiceMock.getByVehicle.mockReturnValue({
        pipe: () => ({
          subscribe: (observer: any) => observer.error(new Error('fail')),
        }),
      } as any);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
    });
  });

  describe('column defs', () => {
    it('should render vehicle.plate as a link and hide the column when embedded', () => {
      // Arrange
      const component = createComponent();
      component.vehicleId = 'v1';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'vehicle.plate')!;

      // Act
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

      // Act
      // Assert
      expect(column.hide).toBe(false);
    });

    it('should format the date column as BR when rendered', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'date')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any)).toContain('/');
    });

    it('should format pricePerLiter and totalCost as BRL currency', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const priceColumn = component.columnDefs.find((c) => c.field === 'pricePerLiter')!;
      const totalColumn = component.columnDefs.find((c) => c.field === 'totalCost')!;

      // Act
      // Assert
      expect((priceColumn.valueFormatter as (p: any) => string)({ value: 5.5 } as any)).toContain('R$');
      expect((totalColumn.valueFormatter as (p: any) => string)({ value: 100 } as any)).toContain('R$');
    });

    describe('status column', () => {
      it.each([
        ['Concluído', 'success'],
        ['Agendado', 'info'],
        ['Cancelado', 'secondary'],
      ])('should render status %s with the %s color when the status matches a known value', (status, color) => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'status')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: status } as any);

        // Assert
        expect(html).toContain(`bg-${color}`);
        expect(html).toContain(status);
      });

      it('should fall back to a secondary badge when the status is unknown', () => {
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

      it('should render an empty label when there is no status', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'status')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: null } as any);

        // Assert
        expect(html).toContain('bg-secondary');
        expect(html).toContain('></span>');
      });
    });

    it('should render the actions column with edit and delete buttons', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as (p: any) => string)({} as any);

      // Assert
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
