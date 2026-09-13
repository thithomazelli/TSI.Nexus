import {
  ModalService,
  NotificationService,
  QuoteTripLeg,
  QuoteTripLegService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { QuoteTripLegListComponent } from './quote-trip-leg-list.component';

describe('QuoteTripLegListComponent', () => {
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
  let quoteTripLegChanged$: Subject<void>;
  let quoteTripLegServiceMock: {
    getByQuoteTrip: ReturnType<typeof vi.fn>;
    quoteTripLegChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): QuoteTripLegListComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    quoteTripLegChanged$ = new Subject();
    quoteTripLegServiceMock = {
      getByQuoteTrip: vi.fn().mockReturnValue(of({ data: [] })),
      quoteTripLegChanged$,
      delete: vi.fn(),
    };
    cdrMock = { markForCheck: vi.fn() };

    return new QuoteTripLegListComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      quoteTripLegServiceMock as unknown as QuoteTripLegService,
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
    it('should build the column defs and load the legs when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(quoteTripLegServiceMock.getByQuoteTrip).toHaveBeenCalledWith('qt1');
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

    it('should reload the legs when quoteTripLegChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt1';
      component.ngOnInit();
      quoteTripLegServiceMock.getByQuoteTrip.mockClear();

      // Act
      quoteTripLegChanged$.next();

      // Assert
      expect(quoteTripLegServiceMock.getByQuoteTrip).toHaveBeenCalledWith('qt1');
    });

    it('should stop reacting to language/quoteTripLegChanged$ when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt1';
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;
      quoteTripLegServiceMock.getByQuoteTrip.mockClear();

      // Act
      language$.next('en');
      quoteTripLegChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(quoteTripLegServiceMock.getByQuoteTrip).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when quoteTripId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt2';

      // Act
      component.ngOnChanges({
        quoteTripId: { firstChange: false } as any,
      });

      // Assert
      expect(quoteTripLegServiceMock.getByQuoteTrip).toHaveBeenCalledWith('qt2');
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt2';

      // Act
      component.ngOnChanges({
        quoteTripId: { firstChange: true } as any,
      });

      // Assert
      expect(quoteTripLegServiceMock.getByQuoteTrip).not.toHaveBeenCalled();
    });

    it('should do nothing when quoteTripId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(quoteTripLegServiceMock.getByQuoteTrip).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should add the quoteTripId and the next sequence number to the initial state when opened', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt1';
      component.rowData = [{ id: 'l1' } as QuoteTripLeg, { id: 'l2' } as QuoteTripLeg];

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ quoteTripId: 'qt1', nextSequenceNumber: 3 }),
      );
    });
  });

  describe('refresh', () => {
    it('should reload and show a success notification when refresh is called', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt1';
      quoteTripLegServiceMock.getByQuoteTrip.mockReturnValue(of({ data: [] }));

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
    it('should do nothing when called', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.noop()).not.toThrow();
    });
  });

  describe('deleteQuoteTripLeg', () => {
    it('should remove the leg from the grid and mark for check when the deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'l1' } as QuoteTripLeg, { id: 'l2' } as QuoteTripLeg];
      quoteTripLegServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteQuoteTripLeg({ id: 'l1' } as QuoteTripLeg);

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
      component.rowData = [{ id: 'l1' } as QuoteTripLeg];
      quoteTripLegServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteQuoteTripLeg({ id: 'l1' } as QuoteTripLeg);

      // Assert
      expect(component.rowData).toEqual([{ id: 'l1' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('load (private, via ngOnInit)', () => {
    it('should do nothing when there is no quoteTripId', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = '' as any;

      // Act
      component.ngOnInit();

      // Assert
      expect(quoteTripLegServiceMock.getByQuoteTrip).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array and mark for check when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.quoteTripId = 'qt1';
      quoteTripLegServiceMock.getByQuoteTrip.mockReturnValue(of({}));

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
      component.quoteTripId = 'qt1';
      quoteTripLegServiceMock.getByQuoteTrip.mockReturnValue(
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
    it('should render the sequenceNumber as a link, falling back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'sequenceNumber')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 1 })).toContain('1');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should format the departureDate as a BR date/time when rendered', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'departureDate')!;

      // Act / Assert
      expect(
        (column.valueFormatter as (p: any) => string)({ value: '2024-01-15T10:00:00' } as any),
      ).toContain('/');
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
