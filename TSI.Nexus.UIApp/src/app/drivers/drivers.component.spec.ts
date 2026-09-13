import { ChangeDetectorRef } from '@angular/core';
import {
  Driver,
  DriverService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { DriversComponent } from './drivers.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('DriversComponent', () => {
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let driverChanged$: Subject<void>;
  let driverServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    driverChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function mockGridRef(): GridComponent<Driver> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Driver>;
  }

  function createComponent(): DriversComponent {
    modalServiceMock = { showTemplateModal: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    driverChanged$ = new Subject();
    driverServiceMock = {
      getAllPaged: vi.fn(),
      driverChanged$,
      delete: vi.fn(),
      refresh: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new DriversComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      driverServiceMock as unknown as DriverService,
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
    it('should delegate to driverService.getAllPaged when called', () => {
      // Arrange
      const component = createComponent();
      const request = { page: 1 } as any;
      driverServiceMock.getAllPaged.mockReturnValue(of({ data: [], total: 0 }));

      // Act
      component.pagedDataSource(request);

      // Assert
      expect(driverServiceMock.getAllPaged).toHaveBeenCalledWith(request);
    });
  });

  describe('ngOnInit', () => {
    it('should purge the grid cache on the second driverChanged$ emission, skipping the initial replay', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      driverChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();

      // Act
      driverChanged$.next();

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop reacting to driverChanged$ after ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      driverChanged$.next();
      driverChanged$.next();

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
    it('should open the driver details modal with the given initial state', () => {
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

  describe('deleteDriver', () => {
    it('should purge the grid cache and notify when the delete succeeds', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      driverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteDriver({ id: 'd1' } as Driver);

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
      driverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteDriver({ id: 'd1' } as Driver);

      // Assert
      expect(gridRef.gridApi!.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falhou',
      );
    });
  });

  describe('refreshDrivers', () => {
    it('should show a success notification when the refresh succeeds', () => {
      // Arrange
      const component = createComponent();
      driverServiceMock.refresh.mockReturnValue(of(undefined));

      // Act
      component.refreshDrivers();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'DRIVERS.DRIVERS_REFRESHED',
      );
    });

    it('should show an error notification when the refresh fails', () => {
      // Arrange
      const component = createComponent();
      driverServiceMock.refresh.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.refreshDrivers();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'DRIVERS.DRIVERS_REFRESH_ERROR',
      );
    });
  });

  describe('employmentTypeMap / statusMap getters', () => {
    it('should expose translated labels for each employment type', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.employmentTypeMap).toEqual({
        CLT: 'CLT',
        Outsourced: 'DRIVERS.OUTSOURCED',
        Autonomous: 'DRIVERS.AUTONOMOUS',
      });
    });

    it('should expose translated labels and colors for each status', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.statusMap['Active']).toEqual({ label: 'DRIVERS.STATUS_ACTIVE', color: 'success' });
      expect(component.statusMap['Inactive']).toEqual({ label: 'DRIVERS.STATUS_INACTIVE', color: 'secondary' });
      expect(component.statusMap['OnLeave']).toEqual({ label: 'DRIVERS.STATUS_ON_LEAVE', color: 'warning' });
    });
  });

  describe('column defs', () => {
    it('should render the name value as a link', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'name')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'João' } as any);

      // Assert
      expect(html).toContain('João');
    });

    it('should format the license expiry date as a BR date', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'licenseExpiryDate')!;

      // Act
      const html = (column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any);

      // Assert
      expect(html).toContain('/');
    });

    it('should translate the employment type and fall back to the raw value when unmapped', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'employmentType')!;

      // Act / Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 'Outsourced' } as any)).toBe(
        'DRIVERS.OUTSOURCED',
      );
      expect((column.valueFormatter as (p: any) => string)({ value: 'Bogus' } as any)).toBe('Bogus');
    });

    it('should render the status badge with the mapped color and label', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'Active' } as any);

      // Assert
      expect(html).toContain('bg-success');
      expect(html).toContain('DRIVERS.STATUS_ACTIVE');
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
