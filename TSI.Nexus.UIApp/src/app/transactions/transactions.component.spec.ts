import { ChangeDetectorRef } from '@angular/core';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  Transaction,
  TransactionService,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { TransactionsComponent } from './transactions.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('TransactionsComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let transactionChanged$: Subject<void>;
  let transactionServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    transactionChanged$: Subject<void>;
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

  function createComponent(): TransactionsComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    transactionChanged$ = new Subject();
    transactionServiceMock = {
      getAllPaged: vi.fn(),
      transactionChanged$,
      delete: vi.fn(),
      getByBusinessPartnerId: vi.fn(),
      getAll: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new TransactionsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      transactionServiceMock as unknown as TransactionService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<Transaction> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Transaction>;
  }

  beforeEach(() => {
    window.history.pushState({}, '', '/transactions');
  });

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should be true when the screen is the main transactions screen', () => {
      // Act / Assert
      expect(createComponent().isTopLevelList).toBe(true);
    });

    it('should be false when embedded under a parent with an id', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };

      // Act / Assert
      expect(component.isTopLevelList).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should build the grid and react to language changes when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(before.length).toBeGreaterThan(0);
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should purge the grid cache on transactionChanged$, skipping the initial replay, at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      transactionChanged$.next();
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      transactionChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should reload on every transactionChanged$ emission when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      transactionServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      transactionChanged$.next();

      // Assert
      expect(transactionServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });

    it('should stop reacting when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      transactionChanged$.next();
      transactionChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when destroyed before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('typeMap / conditionMap / statusMap getters', () => {
    it('should expose translated labels when read', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.typeMap).toEqual({
        Incoming: 'REPORTS.INCOMING',
        Outgoing: 'REPORTS.OUTGOING',
      });
      expect(component.conditionMap).toEqual({
        FullPayment: 'TRANSACTIONS.FULL_PAYMENT',
        InPayments: 'TRANSACTIONS.IN_PAYMENTS',
      });
      expect(component.statusMap).toEqual({
        Approved: 'REPORTS.STATUS_PAID',
        Pending: 'REPORTS.STATUS_OPEN',
        Delayed: 'REPORTS.STATUS_DELAYED',
      });
    });
  });

  describe('openModal', () => {
    it('should open the transaction details modal when called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(expect.anything(), {
        isEdit: false,
      });
    });
  });

  describe('deleteTransaction', () => {
    it('should purge the grid cache when the deletion succeeds at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      transactionServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteTransaction({ id: 't1' } as Transaction);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should remove the transaction from the filtered rows when the deletion succeeds while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.filteredRowData = [{ id: 't1' } as Transaction, { id: 't2' } as Transaction];
      transactionServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteTransaction({ id: 't1' } as Transaction);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 't2' }]);
    });

    it('should not touch the grid/rows but still notify when the deletion fails', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      transactionServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteTransaction({ id: 't1' } as Transaction);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Falha',
        ResponseStatus.Error,
      );
    });
  });

  describe('refreshTransactions', () => {
    it('should just show a notification at the top level', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshTransactions();

      // Assert
      expect(transactionServiceMock.getAll).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRANSACTIONS.TRANSACTIONS_REFRESHED',
      );
    });

    it('should reload transactions for the business partner when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      transactionServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshTransactions();

      // Assert
      expect(transactionServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
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

    it('should filter client-side rows by status and type when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [
        {
          id: 't1',
          status: 'Approved',
          type: 'Incoming',
          date: '2024-01-01',
        } as unknown as Transaction,
        {
          id: 't2',
          status: 'Pending',
          type: 'Outgoing',
          date: '2024-01-02',
        } as unknown as Transaction,
      ];
      component.filterStatus.Approved = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t1']);
    });

    it('should reset state when clearFilters is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [{ id: 't1' } as Transaction];
      component.filterStatus.Approved = true;
      component.filterType.Incoming = true;

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterStatus).toEqual({
        Approved: false,
        Pending: false,
        Delayed: false,
      });
      expect(component.filterType).toEqual({ Incoming: false, Outgoing: false });
      expect(component.filteredRowData).toEqual([{ id: 't1' }]);
    });

    it('should purge the grid cache without touching filteredRowData when clearFilters is called at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.filterStatus.Approved = true;

      // Act
      component.clearFilters();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should exclude rows with no date when a date filter is active while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [
        { id: 't1' } as unknown as Transaction,
        { id: 't2', date: '2024-01-01' } as unknown as Transaction,
      ];
      component.filterStartDate = '2024-01-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t2']);
    });

    it('should filter by start date only while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [
        { id: 't1', date: '2024-01-01' } as unknown as Transaction,
        { id: 't2', date: '2024-02-01' } as unknown as Transaction,
      ];
      component.filterStartDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t2']);
    });

    it('should filter by end date only while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [
        { id: 't1', date: '2024-01-01' } as unknown as Transaction,
        { id: 't2', date: '2024-02-01' } as unknown as Transaction,
      ];
      component.filterEndDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t1']);
    });

    it('should treat a missing status as an empty string when filtering by status while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [{ id: 't1' } as unknown as Transaction];
      component.filterStatus.Approved = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });

    it('should filter by type while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [
        { id: 't1', type: 'Incoming' } as unknown as Transaction,
        { id: 't2', type: 'Outgoing' } as unknown as Transaction,
      ];
      component.filterType.Incoming = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((t) => t.id)).toEqual(['t1']);
    });

    it('should treat a missing type as an empty string when filtering by type while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      component.rowData = [{ id: 't1' } as unknown as Transaction];
      component.filterType.Incoming = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });
  });

  describe('getTransactions (private, via ngOnInit/refreshTransactions)', () => {
    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      transactionServiceMock.getByBusinessPartnerId.mockReturnValue(of({}));

      // Act
      component.refreshTransactions();

      // Assert
      expect(component.rowData).toEqual([]);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' };
      transactionServiceMock.getByBusinessPartnerId.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.refreshTransactions();

      // Assert
      expect(component.loading).toBe(false);
    });

    it('should run without a callback when called directly with none', () => {
      // Arrange
      const component = createComponent();
      transactionServiceMock.getAll.mockReturnValue(of({ data: [] }));

      // Act / Assert
      expect(() => (component as any).getTransactions()).not.toThrow();
    });
  });

  describe('pagedDataSource', () => {
    it('should forward the active status filters when pagedDataSource is called', () => {
      // Arrange
      const component = createComponent();
      component.filterStatus.Delayed = true;

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(transactionServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: ['Delayed'] }),
      );
    });

    it('should fall back to undefined dates when no date filter is set', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(transactionServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: undefined, endDate: undefined, statuses: [] }),
      );
    });
  });

  describe('setFiltersFromQueryParams (via ngOnInit)', () => {
    it('should read filters from the URL when ngOnInit is called', () => {
      // Arrange
      window.history.pushState(
        {},
        '',
        '/transactions?status=Approved&type=Incoming&startDate=2024-01-01&endDate=2024-01-31',
      );
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus.Approved).toBe(true);
      expect(component.filterType.Incoming).toBe(true);
      expect(component.filterStartDate).toBe('2024-01-01');
      expect(component.filterEndDate).toBe('2024-01-31');
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should ignore status/type values that are not known filter keys', () => {
      // Arrange
      window.history.pushState({}, '', '/transactions?status=Bogus,Approved&type=Bogus,Incoming');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus.Approved).toBe(true);
      expect(component.filterType.Incoming).toBe(true);
      expect((component.filterStatus as any).Bogus).toBeUndefined();
      expect((component.filterType as any).Bogus).toBeUndefined();
    });

    it('should set showFiltersOnInit to true when only a type filter is active', () => {
      // Arrange
      window.history.pushState({}, '', '/transactions?type=Incoming');
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

  describe('column value formatters', () => {
    it('should translate a known condition and fall back to the raw value otherwise', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'condition')!;

      // Act / Assert
      expect((column.valueFormatter as (params: any) => string)({ value: 'FullPayment' })).toBe(
        'TRANSACTIONS.FULL_PAYMENT',
      );
      expect((column.valueFormatter as (params: any) => string)({ value: 'Weird' })).toBe(
        'Weird',
      );
    });

    it('should fall back to an empty string when the condition is missing entirely', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'condition')!;

      // Act / Assert
      expect((column.valueFormatter as (params: any) => string)({ value: null })).toBe('');
    });

    it('should resolve the condition filterValueGetter from the row data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'condition')!;

      // Act / Assert
      expect(
        (column.filterValueGetter as (p: any) => string)({ data: { condition: 'InPayments' } }),
      ).toBe('TRANSACTIONS.IN_PAYMENTS');
    });

    it('should color the status badge based on the status when rendered', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'status' && c.cellRenderer)!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: 'Delayed' });

      // Assert
      expect(html).toContain('bg-danger');
      expect(html).toContain('REPORTS.STATUS_DELAYED');
    });

    it('should fall back to the raw value and default color when the status is unknown', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: 'Weird' });

      // Assert
      expect(html).toContain('bg-secondary');
      expect(html).toContain('Weird');
    });

    it('should resolve the status filterValueGetter from the row data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act / Assert
      expect(
        (column.filterValueGetter as (p: any) => string)({ data: { status: 'Approved' } }),
      ).toBe('REPORTS.STATUS_PAID');
    });

    it('should render the description as a link, falling back to an empty string when missing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'description')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Desc' })).toContain('Desc');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should apply a success/danger cell class to positive payment/expense values and none otherwise', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const paymentColumn = component.columnDefs.find((c) => c.field === 'paymentTotalPrice')!;
      const expenseColumn = component.columnDefs.find((c) => c.field === 'expenseTotalPrice')!;

      // Act / Assert
      expect((paymentColumn.cellClass as (p: any) => string)({ value: 10 })).toBe('text-success');
      expect((paymentColumn.cellClass as (p: any) => string)({ value: 0 })).toBe('');
      expect((expenseColumn.cellClass as (p: any) => string)({ value: 10 })).toBe('text-danger');
      expect((expenseColumn.cellClass as (p: any) => string)({ value: 0 })).toBe('');
      expect(
        (paymentColumn.valueFormatter as (p: any) => string)({ value: 10 } as any),
      ).toContain('R$');
      expect(
        (expenseColumn.valueFormatter as (p: any) => string)({ value: 10 } as any),
      ).toContain('R$');
    });

    it('should fall back to an empty string when the status is completely missing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: undefined });

      // Assert
      expect(html).toContain('bg-secondary');
      expect(html).not.toContain('undefined');
    });

    it('should format date as a BR date when rendered', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'date')!;

      // Act / Assert
      expect(
        (column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any),
      ).toContain('/');
    });

    it('should render businessPartnerName falling back to N/A and hide the column when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Act / Assert
      expect(column.hide).toBe(true);
      expect((column.cellRenderer as (p: any) => string)({ value: 'Cliente A' })).toBe(
        'Cliente A',
      );
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toBe('N/A');
    });

    it('should render orderNumber falling back to N/A when missing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'orderNumber')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '123' })).toBe('123');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toBe('N/A');
    });

    it('should render the actions column buttons when rendered', () => {
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
