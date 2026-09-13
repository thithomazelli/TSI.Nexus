import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TripLeg,
  TripLegService,
  TranslationService,
} from '@nexus/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { TripLegListComponent } from './trip-leg-list.component';

describe('TripLegListComponent', () => {
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
  let tripLegChanged$: Subject<void>;
  let tripLegServiceMock: {
    getByTrip: ReturnType<typeof vi.fn>;
    tripLegChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): TripLegListComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    tripLegChanged$ = new Subject();
    tripLegServiceMock = {
      getByTrip: vi.fn().mockReturnValue(of({ data: [] })),
      tripLegChanged$,
      delete: vi.fn(),
    };
    cdrMock = { markForCheck: vi.fn() };

    return new TripLegListComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      tripLegServiceMock as unknown as TripLegService,
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
    it('should build the column defs and load the legs when initialized', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(tripLegServiceMock.getByTrip).toHaveBeenCalledWith('t1');
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

    it('should reload the legs when tripLegChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.ngOnInit();
      tripLegServiceMock.getByTrip.mockClear();

      // Act
      tripLegChanged$.next();

      // Assert
      expect(tripLegServiceMock.getByTrip).toHaveBeenCalledWith('t1');
    });

    it('should stop reacting to language/tripLegChanged$ when ngOnDestroy has run', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;
      tripLegServiceMock.getByTrip.mockClear();

      // Act
      language$.next('en');
      tripLegChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(tripLegServiceMock.getByTrip).not.toHaveBeenCalled();
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
      expect(tripLegServiceMock.getByTrip).toHaveBeenCalledWith('t2');
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't2';

      // Act
      component.ngOnChanges({ tripId: { firstChange: true } as any });

      // Assert
      expect(tripLegServiceMock.getByTrip).not.toHaveBeenCalled();
    });

    it('should do nothing when tripId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(tripLegServiceMock.getByTrip).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should add the tripId and the next sequence number to the initial state when opening', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.rowData = [{ id: 'l1' } as TripLeg, { id: 'l2' } as TripLeg];

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tripId: 't1', nextSequenceNumber: 3 }),
      );
    });
  });

  describe('refresh', () => {
    it('should reload and show a success notification when refresh is called', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRIPS.LEGS_REFRESHED',
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

  describe('deleteTripLeg', () => {
    it('should remove the leg from the grid and mark for check when deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'l1' } as TripLeg, { id: 'l2' } as TripLeg];
      tripLegServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteTripLeg({ id: 'l1' } as TripLeg);

      // Assert
      expect(component.rowData).toEqual([{ id: 'l2' }]);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not touch the grid rows but still mark for check when the deletion fails', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'l1' } as TripLeg];
      tripLegServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteTripLeg({ id: 'l1' } as TripLeg);

      // Assert
      expect(component.rowData).toEqual([{ id: 'l1' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
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
      expect(tripLegServiceMock.getByTrip).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array and mark for check when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      tripLegServiceMock.getByTrip.mockReturnValue(of({}));

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
      component.tripId = 't1';
      tripLegServiceMock.getByTrip.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('column defs cell renderers', () => {
    it('should render the sequenceNumber as a link and fall back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'sequenceNumber')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 1 })).toContain('1');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should format the departureDate as a BR date/time when rendered', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'departureDate')!;

      // Act
      const formatted = (column.valueFormatter as (p: any) => string)({ value: '2024-01-15T10:00:00' } as any);

      // Assert
      expect(formatted).toContain('/');
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
