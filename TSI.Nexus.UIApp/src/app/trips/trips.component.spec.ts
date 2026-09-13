import { ChangeDetectorRef } from '@angular/core';
import {
  Company,
  Driver,
  Individual,
  ModalService,
  NotificationService,
  ResponseStatus,
  Trip,
  TripService,
  TranslationService,
  Vehicle,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of } from 'rxjs';
import { TripsComponent } from './trips.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('TripsComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let tripChanged$: Subject<void>;
  let tripServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    tripChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    getByDriverId: ReturnType<typeof vi.fn>;
    getByVehicleId: ReturnType<typeof vi.fn>;
    getByBusinessPartnerId: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): TripsComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    tripChanged$ = new Subject();
    tripServiceMock = {
      getAllPaged: vi.fn(),
      tripChanged$,
      delete: vi.fn(),
      getByDriverId: vi.fn(),
      getByVehicleId: vi.fn(),
      getByBusinessPartnerId: vi.fn(),
      getAll: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new TripsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      tripServiceMock as unknown as TripService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<Trip> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Trip>;
  }

  beforeEach(() => {
    window.history.pushState({}, '', '/trips');
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should be true when it is the main trips screen', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(true);
    });

    it('should be false when embedded in a driver with an id', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(false);
    });

    it('should be false when embedded in a vehicle with an id', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Vehicle';
      component.parentData = { id: 'v1' } as Vehicle;

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(false);
    });

    it('should be false when embedded in any other entity with an id', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(false);
    });

    it('should be true when an entity is set but the parent has no id', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = null;

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should build the grid, react to language changes and mark for check', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;
      cdrMock.markForCheck.mockClear();

      // Act
      language$.next('en');

      // Assert
      expect(before.length).toBeGreaterThan(0);
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should purge the grid cache on tripChanged$, skipping the initial replay, when top-level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      tripChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      tripChanged$.next();
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should reload trips on every tripChanged$ emission, including the first, when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      tripServiceMock.getByDriverId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      tripChanged$.next();

      // Assert
      expect(tripServiceMock.getByDriverId).toHaveBeenCalledWith('d1');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe tripChanged$ and complete the destroy subject when called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();

      tripChanged$.next();
      expect(tripServiceMock.getAllPaged).not.toHaveBeenCalledWith(
        expect.anything(),
      );
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
    it('should prefill a new trip with the parent vehicle when adding', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Vehicle';
      component.parentData = { id: 'v1', plate: 'ABC1234' } as Vehicle;

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ vehicleId: 'v1', vehiclePlate: 'ABC1234' }),
        }),
      );
    });

    it('should prefill a new trip with the parent business partner when adding', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1', name: 'Motorista A' } as Driver;

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            businessPartnerId: 'd1',
            businessPartnerName: 'Motorista A',
          }),
        }),
      );
    });

    it('should not overwrite the trip data when editing', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Vehicle';
      component.parentData = { id: 'v1' } as Vehicle;
      const trip = { id: 't1' };

      // Act
      component.openModal({ isEdit: true, data: trip });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: trip }),
      );
    });

    it('should not prefill when there is no parent data', () => {
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

  describe('deleteTrip', () => {
    it('should purge the grid cache when the deletion succeeds, when top-level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      tripServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteTrip({ id: 't1' } as Trip);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should remove the trip from the filtered rows and mark for check when the deletion succeeds, when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.filteredRowData = [{ id: 't1' } as Trip, { id: 't2' } as Trip];
      tripServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteTrip({ id: 't1' } as Trip);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 't2' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not touch rows when the delete reports an error status', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.filteredRowData = [{ id: 't1' } as Trip];
      tripServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteTrip({ id: 't1' } as Trip);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 't1' }]);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Falhou',
        ResponseStatus.Error,
      );
    });
  });

  describe('refreshTrips', () => {
    it('should just show a notification when top-level', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshTrips();

      // Assert
      expect(tripServiceMock.getAll).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRIPS.TRIPS_REFRESHED',
      );
    });

    it('should reload trips for the driver and notify when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      tripServiceMock.getByDriverId.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshTrips();

      // Assert
      expect(tripServiceMock.getByDriverId).toHaveBeenCalledWith('d1');
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRIPS.TRIPS_REFRESHED',
      );
    });
  });

  describe('applyFilters / clearFilters', () => {
    it('should just purge the grid cache when applyFilters is called top-level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;

      // Act
      component.applyFilters();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should filter client-side rows by status when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.rowData = [
        { id: 't1', status: 'Open', createDate: '2024-01-01' } as unknown as Trip,
        { id: 't2', status: 'Closed', createDate: '2024-01-02' } as unknown as Trip,
      ];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t1']);
    });

    it('should treat a row with no status as not matching any selected status when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.rowData = [{ id: 't1', status: undefined } as unknown as Trip];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });

    it('should filter client-side rows by an end date only when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.rowData = [
        { id: 't1', createDate: '2024-01-01' } as unknown as Trip,
        { id: 't2', createDate: '2024-02-01' } as unknown as Trip,
      ];
      component.filterEndDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t1']);
    });

    it('should filter client-side rows by a start/end date range when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.rowData = [
        { id: 't1', createDate: '2024-01-01' } as unknown as Trip,
        { id: 't2', createDate: '2024-02-01' } as unknown as Trip,
        { id: 't3', createDate: '2024-03-01' } as unknown as Trip,
      ];
      component.filterStartDate = '2024-01-15';
      component.filterEndDate = '2024-02-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t2']);
    });

    it('should exclude rows without a createDate when a date filter is active, when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.rowData = [
        { id: 't1', createDate: null } as unknown as Trip,
        { id: 't2', createDate: '2024-01-01' } as unknown as Trip,
      ];
      component.filterStartDate = '2024-01-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t2']);
    });

    it('should reset state and reapply when clearFilters is called, when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      component.rowData = [{ id: 't1' } as Trip];
      component.filterStatus.Open = true;

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterStatus).toEqual({
        Open: false,
        WaitingPayment: false,
        Closed: false,
      });
      expect(component.filteredRowData).toEqual([{ id: 't1' }]);
    });

    it('should just purge the grid cache when clearFilters is called, when top-level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;

      // Act
      component.clearFilters();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });
  });

  describe('pagedDataSource', () => {
    it('should forward the active filters to the paged request', () => {
      // Arrange
      const component = createComponent();
      component.filterStartDate = '2024-01-01';
      component.filterEndDate = '2024-01-31';
      component.filterStatus.Closed = true;

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(tripServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          statuses: ['Closed'],
        }),
      );
    });

    it('should omit start/end date when neither filter is set', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(tripServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: undefined, endDate: undefined }),
      );
    });
  });

  describe('setFiltersFromQueryParams (via ngOnInit)', () => {
    it('should read status and date filters from the URL', () => {
      // Arrange
      window.history.pushState(
        {},
        '',
        '/trips?status=Open,Closed&startDate=2024-01-01&endDate=2024-01-31',
      );
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus.Open).toBe(true);
      expect(component.filterStatus.Closed).toBe(true);
      expect(component.filterStatus.WaitingPayment).toBe(false);
      expect(component.filterStartDate).toBe('2024-01-01');
      expect(component.filterEndDate).toBe('2024-01-31');
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should ignore unknown status values from the URL', () => {
      // Arrange
      window.history.pushState({}, '', '/trips?status=Bogus');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus).toEqual({
        Open: false,
        WaitingPayment: false,
        Closed: false,
      });
    });

    it('should leave filters empty and showFiltersOnInit false when there are no query params', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.showFiltersOnInit).toBe(false);
    });

    it('should set showFiltersOnInit from a status filter alone, with no date range', () => {
      // Arrange
      window.history.pushState({}, '', '/trips?status=Open');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.showFiltersOnInit).toBe(true);
    });
  });

  describe('getTrips (private, direct call)', () => {
    it('should fall back to tripService.getAll() and mark for check when not scoped to any parent entity', () => {
      // Arrange
      const component = createComponent();
      tripServiceMock.getAll.mockReturnValue(of({ data: [] }));

      // Act
      // Assert
      expect(() => (component as any).getTrips()).not.toThrow();

      expect(tripServiceMock.getAll).toHaveBeenCalled();
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('getTrips (via refreshTrips on embedded views)', () => {
    it('should fetch by vehicle when embedded in a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Vehicle';
      component.parentData = { id: 'v1' } as Vehicle;
      tripServiceMock.getByVehicleId.mockReturnValue(of({ data: [{ id: 't1' }] }));

      // Act
      component.refreshTrips();

      // Assert
      expect(tripServiceMock.getByVehicleId).toHaveBeenCalledWith('v1');
      expect(component.rowData).toEqual([{ id: 't1' }]);
      expect(component.loading).toBe(false);
    });

    it('should fetch by business partner when embedded in any other entity', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      tripServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshTrips();

      // Assert
      expect(tripServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      tripServiceMock.getByDriverId.mockReturnValue(of({}));

      // Act
      component.refreshTrips();

      // Assert
      expect(component.rowData).toEqual([]);
    });

    it('should stop loading and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Driver';
      component.parentData = { id: 'd1' } as Driver;
      const errorSubject = new Subject<never>();
      tripServiceMock.getByDriverId.mockReturnValue(errorSubject.asObservable());

      // Act
      component.refreshTrips();
      expect(() => errorSubject.error(new Error('boom'))).not.toThrow();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('initializeGrid cell renderers', () => {
    function columnByField(component: TripsComponent, field: string) {
      return component.columnDefs.find((c) => c.field === field)!;
    }

    it('should render the trip number and business partner name as links', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const tripNumberHtml = (columnByField(component, 'tripNumber').cellRenderer as any)({
        value: 'T-1',
      });
      const partnerHtml = (columnByField(component, 'businessPartnerName').cellRenderer as any)({
        value: 'Cliente A',
      });

      // Assert
      expect(tripNumberHtml).toContain('T-1');
      expect(partnerHtml).toContain('Cliente A');
    });

    it('should render an empty link when the cell value is missing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const tripNumberHtml = (columnByField(component, 'tripNumber').cellRenderer as any)({
        value: null,
      });
      const partnerHtml = (columnByField(component, 'businessPartnerName').cellRenderer as any)({
        value: null,
      });

      // Assert
      expect(tripNumberHtml).toContain('ag-link');
      expect(partnerHtml).toContain('ag-link');
    });

    it('should hide the business partner column when embedded in a business partner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';

      // Act
      component.ngOnInit();

      // Assert
      expect(columnByField(component, 'businessPartnerName').hide).toBe(true);
    });

    it('should hide the vehicle plate column when embedded in a vehicle', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Vehicle';

      // Act
      component.ngOnInit();

      // Assert
      expect(columnByField(component, 'vehiclePlate').hide).toBe(true);
    });

    it('should format total price and date columns', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const priceHtml = (columnByField(component, 'totalPrice').valueFormatter as any)({
        value: 1234.5,
      });
      const dateHtml = (columnByField(component, 'date').valueFormatter as any)({
        value: '2024-01-15',
      });

      // Assert
      expect(typeof priceHtml).toBe('string');
      expect(typeof dateHtml).toBe('string');
    });

    it.each([
      ['Closed', 'QUOTES.STATUS_CLOSED', 'success'],
      ['Open', 'QUOTES.STATUS_OPEN', 'info'],
      ['WaitingPayment', 'QUOTES.STATUS_WAITING_PAYMENT', 'warning'],
      ['SomethingElse', 'SomethingElse', 'secondary'],
    ])('should render the %s status badge with the expected label and color', (value, expectedLabel, expectedColor) => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const html = (columnByField(component, 'status').cellRenderer as any)({ value });

      // Assert
      expect(html).toContain(expectedColor);
      expect(html).toContain(expectedLabel);
    });

    it('should render the action buttons column', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const actionsColumn = component.columnDefs[component.columnDefs.length - 1];
      const html = (actionsColumn.cellRenderer as any)();

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
