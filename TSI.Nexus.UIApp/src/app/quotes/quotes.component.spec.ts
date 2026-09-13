import { ChangeDetectorRef } from '@angular/core';
import {
  Company,
  FeatureFlagService,
  ModalService,
  NotificationService,
  Quote,
  QuoteService,
  QuoteType,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { QuotesComponent } from './quotes.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('QuotesComponent', () => {
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let quoteChanged$: Subject<void>;
  let quoteServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    quoteChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    getByBusinessPartnerId: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): QuotesComponent {
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    quoteChanged$ = new Subject();
    quoteServiceMock = {
      getAllPaged: vi.fn(),
      quoteChanged$,
      delete: vi.fn(),
      getByBusinessPartnerId: vi.fn(),
      getAll: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new QuotesComponent(
      featureFlagServiceMock as unknown as FeatureFlagService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      quoteServiceMock as unknown as QuoteService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<Quote> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Quote>;
  }

  beforeEach(() => {
    window.history.pushState({}, '', '/quotes');
  });

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should be true when on the main quotes screen', () => {
      // Act
      const component = createComponent();

      // Assert
      expect(component.isTopLevelList).toBe(true);
    });

    it('should be false when embedded in a business partner with an id', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should build the grid, read the fleet module flag and mark for check when initialized', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(featureFlagServiceMock.isEnabled).toHaveBeenCalled();
      expect(component.isFleetModuleEnabled).toBe(true);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should purge the grid cache on quoteChanged$ skipping the initial replay when top-level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      quoteChanged$.next();
      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      // Act
      quoteChanged$.next();
      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should reload on every quoteChanged$ emission when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      quoteServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      quoteChanged$.next();

      // Assert
      expect(quoteServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });

    it('should stop reacting when ngOnDestroy has run', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      quoteChanged$.next();
      quoteChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });

    it('should rebuild the grid and mark for check when the language changes', () => {
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
  });

  describe('ngOnDestroy', () => {
    it('should not throw when destroyed before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('openModal', () => {
    it('should prefill a new quote with the parent business partner when opening the modal', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1', name: 'Cliente A' } as Company;

      // Act
      component.openModal({ isEdit: false, data: { type: QuoteType.Product } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            businessPartnerId: 'bp1',
            businessPartnerName: 'Cliente A',
            type: QuoteType.Product,
          }),
        }),
      );
    });
  });

  describe('openNewProductQuoteModal / openNewTripQuoteModal', () => {
    it('should open the modal with the Product type when openNewProductQuoteModal is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openNewProductQuoteModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ type: QuoteType.Product }) }),
      );
    });

    it('should open the modal with the Trip type when openNewTripQuoteModal is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openNewTripQuoteModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ type: QuoteType.Trip }) }),
      );
    });
  });

  describe('deleteQuote', () => {
    it('should purge the grid cache when deletion succeeds at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      quoteServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteQuote({ id: 'q1' } as Quote);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should remove the quote from the filtered rows and mark for check when deletion succeeds while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.filteredRowData = [{ id: 'q1' } as Quote, { id: 'q2' } as Quote];
      quoteServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteQuote({ id: 'q1' } as Quote);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 'q2' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not touch the grid/rows but still notify when the deletion fails', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      quoteServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteQuote({ id: 'q1' } as Quote);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Falha',
        ResponseStatus.Error,
      );
    });
  });

  describe('refreshQuotes', () => {
    it('should just show a notification when at the top level', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshQuotes();

      // Assert
      expect(quoteServiceMock.getAll).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'QUOTES.QUOTES_REFRESHED',
      );
    });

    it('should reload quotes for the business partner when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      quoteServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshQuotes();

      // Assert
      expect(quoteServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });
  });

  describe('applyFilters / clearFilters', () => {
    it('should just purge the grid cache when applyFilters is called at the top level', () => {
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
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'q1', status: 'Open', createDate: '2024-01-01' } as unknown as Quote,
        { id: 'q2', status: 'Closed', createDate: '2024-01-02' } as unknown as Quote,
      ];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((q) => q.id)).toEqual(['q1']);
    });

    it('should reset the filter state when clearFilters is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [{ id: 'q1' } as Quote];
      component.filterStatus.Open = true;

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterStatus).toEqual({
        Open: false,
        WaitingPayment: false,
        Closed: false,
      });
      expect(component.filteredRowData).toEqual([{ id: 'q1' }]);
    });

    it('should purge the grid cache without touching filteredRowData when clearFilters runs at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.filterStatus.Open = true;

      // Act
      component.clearFilters();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should exclude rows with no createDate when a date filter is active while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'q1' } as unknown as Quote,
        { id: 'q2', createDate: '2024-01-01' } as unknown as Quote,
      ];
      component.filterStartDate = '2024-01-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((q) => q.id)).toEqual(['q2']);
    });

    it('should filter by start date only when only a start date is set', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'q1', createDate: '2024-01-01' } as unknown as Quote,
        { id: 'q2', createDate: '2024-02-01' } as unknown as Quote,
      ];
      component.filterStartDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((q) => q.id)).toEqual(['q2']);
    });

    it('should filter by end date only when only an end date is set', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'q1', createDate: '2024-01-01' } as unknown as Quote,
        { id: 'q2', createDate: '2024-02-01' } as unknown as Quote,
      ];
      component.filterEndDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((q) => q.id)).toEqual(['q1']);
    });

    it('should treat a missing status as an empty string when filtering by status', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [{ id: 'q1' } as unknown as Quote];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });
  });

  describe('pagedDataSource', () => {
    it('should forward the active filters when requesting a page', () => {
      // Arrange
      const component = createComponent();
      component.filterStatus.Closed = true;

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(quoteServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: ['Closed'] }),
      );
    });
  });

  describe('getQuotes (private, via ngOnInit/refreshQuotes)', () => {
    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      quoteServiceMock.getByBusinessPartnerId.mockReturnValue(of({}));

      // Act
      component.refreshQuotes();

      // Assert
      expect(component.rowData).toEqual([]);
    });

    it('should stop loading and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      quoteServiceMock.getByBusinessPartnerId.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.refreshQuotes();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should run without a callback when called directly with none', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.getAll.mockReturnValue(of({ data: [] }));

      // Act
      // Assert
      expect(() => (component as any).getQuotes()).not.toThrow();
    });
  });

  describe('setFiltersFromQueryParams (via ngOnInit)', () => {
    it('should read filters from the URL when they are present', () => {
      // Arrange
      window.history.pushState(
        {},
        '',
        '/quotes?status=Open&startDate=2024-01-01&endDate=2024-01-31',
      );
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus.Open).toBe(true);
      expect(component.filterStartDate).toBe('2024-01-01');
      expect(component.filterEndDate).toBe('2024-01-31');
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should ignore status values that are not known filter keys', () => {
      // Arrange
      window.history.pushState({}, '', '/quotes?status=Bogus,Open');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus.Open).toBe(true);
      expect((component.filterStatus as any).Bogus).toBeUndefined();
    });

    it('should set showFiltersOnInit true when only a status filter is active with no dates', () => {
      // Arrange
      window.history.pushState({}, '', '/quotes?status=Open');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should leave showFiltersOnInit false when there are no query params', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.showFiltersOnInit).toBe(false);
    });
  });

  describe('column cell renderers', () => {
    it('should label a Trip quote when the type column renders', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: 'Trip' });

      // Assert
      expect(html).toContain('TRIPS.SINGULAR');
    });

    it('should label a Product quote when the type column renders', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: 'Product' });

      // Assert
      expect(html).toContain('PRODUCTS.SINGULAR');
    });

    it('should render the quoteNumber value as a link and fall back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'quoteNumber')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '123' })).toContain('123');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should render the businessPartnerName value as a link and fall back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Cliente A' })).toContain(
        'Cliente A',
      );
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should hide the businessPartnerName column when embedded in a business partner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';

      // Act
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Assert
      expect(column.hide).toBe(true);
    });

    it('should format totalPrice as BRL currency when the column renders', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'totalPrice')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 100 } as any)).toContain(
        'R$',
      );
    });

    it('should format date as a BR date when the column renders', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'date')!;

      // Act
      // Assert
      expect(
        (column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any),
      ).toContain('/');
    });

    describe('status column', () => {
      it.each([
        ['Closed', 'success', 'QUOTES.STATUS_CLOSED'],
        ['Open', 'info', 'QUOTES.STATUS_OPEN'],
        ['WaitingPayment', 'warning', 'QUOTES.STATUS_WAITING_PAYMENT'],
      ])('should render status %s with the %s color and its translated label when the cell renders', (status, color, label) => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.headerName === 'COMMON.STATUS')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: status });

        // Assert
        expect(html).toContain(`bg-${color}`);
        expect(html).toContain(label);
      });

      it('should fall back to a secondary badge with the raw value when the status is unknown', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.headerName === 'COMMON.STATUS')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: 'Unknown' });

        // Assert
        expect(html).toContain('bg-secondary');
        expect(html).toContain('Unknown');
      });
    });

    it('should render the actions column buttons when the cell renderer runs', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
