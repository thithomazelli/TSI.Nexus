import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TripDriver,
  TripDriverService,
  TranslationService,
} from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { TripDriverListComponent } from './trip-driver-list.component';

describe('TripDriverListComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let tripDriverChanged$: Subject<void>;
  let tripDriverServiceMock: {
    getByTripId: ReturnType<typeof vi.fn>;
    tripDriverChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createComponent(): TripDriverListComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    tripDriverChanged$ = new Subject();
    tripDriverServiceMock = {
      getByTripId: vi.fn().mockReturnValue(of({ data: [] })),
      tripDriverChanged$,
      delete: vi.fn(),
    };

    return new TripDriverListComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      tripDriverServiceMock as unknown as TripDriverService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the column defs and load the drivers', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(tripDriverServiceMock.getByTripId).toHaveBeenCalledWith('t1');
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

    it('should reload the drivers when tripDriverChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.ngOnInit();
      tripDriverServiceMock.getByTripId.mockClear();

      // Act
      tripDriverChanged$.next();

      // Assert
      expect(tripDriverServiceMock.getByTripId).toHaveBeenCalledWith('t1');
    });

    it('should stop reacting to language/tripDriverChanged$ when ngOnDestroy was called', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;
      tripDriverServiceMock.getByTripId.mockClear();

      // Act
      language$.next('en');
      tripDriverChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(tripDriverServiceMock.getByTripId).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when tripId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't2';

      // Act
      component.ngOnChanges({ tripId: { firstChange: false } as any });

      // Assert
      expect(tripDriverServiceMock.getByTripId).toHaveBeenCalledWith('t2');
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't2';

      // Act
      component.ngOnChanges({ tripId: { firstChange: true } as any });

      // Assert
      expect(tripDriverServiceMock.getByTripId).not.toHaveBeenCalled();
    });

    it('should do nothing when tripId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(tripDriverServiceMock.getByTripId).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should add the parentId and parentData to the initial state', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.rowData = [{ id: 'd1' } as TripDriver];

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 't1', parentData: [{ id: 'd1' }] }),
      );
    });
  });

  describe('refresh', () => {
    it('should reload and show a success notification when called', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRIPS.DRIVERS_REFRESHED',
      );
    });
  });

  describe('noop', () => {
    it('should do nothing when called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.noop()).not.toThrow();
    });
  });

  describe('deleteTripDriver', () => {
    it('should remove the driver from the grid when deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'd1' } as TripDriver, { id: 'd2' } as TripDriver];
      tripDriverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteTripDriver({ id: 'd1' } as TripDriver);

      // Assert
      expect(component.rowData).toEqual([{ id: 'd2' }]);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should not touch the grid rows when the deletion fails', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'd1' } as TripDriver];
      tripDriverServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteTripDriver({ id: 'd1' } as TripDriver);

      // Assert
      expect(component.rowData).toEqual([{ id: 'd1' }]);
    });
  });

  describe('load (private, via ngOnInit)', () => {
    it('should do nothing when there is no tripId', () => {
      // Arrange
      const component = createComponent();
      component.tripId = '' as any;

      // Act
      component.ngOnInit();

      // Assert
      expect(tripDriverServiceMock.getByTripId).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      tripDriverServiceMock.getByTripId.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      tripDriverServiceMock.getByTripId.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
    });
  });

  describe('column defs cell renderers', () => {
    it('should render the driverName as a link and fall back to an empty string when the value is null', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'driverName')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'João' })).toContain('João');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should format driverLicenseExpiryDate as a BR date', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'driverLicenseExpiryDate')!;

      // Act
      // Assert
      expect(
        (column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any),
      ).toContain('/');
    });

    it('should format amount as BRL currency', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'amount')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 100 } as any)).toContain(
        'R$',
      );
    });

    it('should render the actions column buttons when the cell renderer is invoked', () => {
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
