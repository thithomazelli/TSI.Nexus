import {
  ModalService,
  NotificationService,
  Passenger,
  PassengerService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { PassengerListComponent } from './passenger-list.component';

describe('PassengerListComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let passengerChanged$: Subject<void>;
  let passengerServiceMock: {
    getByTrip: ReturnType<typeof vi.fn>;
    passengerChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): PassengerListComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    passengerChanged$ = new Subject();
    passengerServiceMock = {
      getByTrip: vi.fn().mockReturnValue(of({ data: [] })),
      passengerChanged$,
      delete: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new PassengerListComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      passengerServiceMock as unknown as PassengerService,
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
    it('should build the column defs and load the passengers when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(passengerServiceMock.getByTrip).toHaveBeenCalledWith('t1');
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

    it('should reload the passengers when passengerChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.ngOnInit();
      passengerServiceMock.getByTrip.mockClear();

      // Act
      passengerChanged$.next();

      // Assert
      expect(passengerServiceMock.getByTrip).toHaveBeenCalledWith('t1');
    });

    it('should stop reacting to language/passengerChanged$ when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;
      passengerServiceMock.getByTrip.mockClear();

      // Act
      language$.next('en');
      passengerChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(passengerServiceMock.getByTrip).not.toHaveBeenCalled();
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
      expect(passengerServiceMock.getByTrip).toHaveBeenCalledWith('t2');
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't2';

      // Act
      component.ngOnChanges({ tripId: { firstChange: true } as any });

      // Assert
      expect(passengerServiceMock.getByTrip).not.toHaveBeenCalled();
    });

    it('should do nothing when tripId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(passengerServiceMock.getByTrip).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should add the tripId to the initial state when opened', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tripId: 't1' }),
      );
    });
  });

  describe('openImportModal', () => {
    it('should open the import modal with the tripId when called', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';

      // Act
      component.openImportModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(expect.anything(), {
        tripId: 't1',
      });
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
        'TRIPS.PASSENGERS_REFRESHED',
      );
    });
  });

  describe('noop', () => {
    it('should do nothing when called', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.noop()).not.toThrow();
    });
  });

  describe('deletePassenger', () => {
    it('should remove the passenger from the grid and mark for check when the deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'p1' } as Passenger, { id: 'p2' } as Passenger];
      passengerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deletePassenger({ id: 'p1' } as Passenger);

      // Assert
      expect(component.rowData).toEqual([{ id: 'p2' }]);
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
      component.rowData = [{ id: 'p1' } as Passenger];
      passengerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deletePassenger({ id: 'p1' } as Passenger);

      // Assert
      expect(component.rowData).toEqual([{ id: 'p1' }]);
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
      expect(passengerServiceMock.getByTrip).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array and mark for check when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.tripId = 't1';
      passengerServiceMock.getByTrip.mockReturnValue(of({}));

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
      passengerServiceMock.getByTrip.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('column defs cell renderers', () => {
    it('should render the name as a link, falling back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'name')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'João' })).toContain('João');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should render the actions column buttons when rendered', () => {
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
