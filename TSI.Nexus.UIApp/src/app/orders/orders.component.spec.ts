import { ChangeDetectorRef } from '@angular/core';
import {
  Company,
  ModalService,
  NotificationService,
  Order,
  OrderService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('OrdersComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let orderChanged$: Subject<void>;
  let orderServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    orderChanged$: Subject<void>;
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

  function createComponent(): OrdersComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    orderChanged$ = new Subject();
    orderServiceMock = {
      getAllPaged: vi.fn(),
      orderChanged$,
      delete: vi.fn(),
      getByBusinessPartnerId: vi.fn(),
      getAll: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new OrdersComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      orderServiceMock as unknown as OrderService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<Order> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Order>;
  }

  beforeEach(() => {
    window.history.pushState({}, '', '/orders');
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should return true when on the main orders screen', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isTopLevelList).toBe(true);
    });

    it('should return false when embedded in a business partner with an id', () => {
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
    it('should build the grid and react to language changes when ngOnInit runs', () => {
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

    it('should purge the grid cache on orderChanged$ but skip the initial replay when top-level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      orderChanged$.next();
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      orderChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should reload orders on every orderChanged$ emission including the first when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      orderServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      orderChanged$.next();

      // Assert
      expect(orderServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop reacting to orderChanged$ when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      orderChanged$.next();
      orderChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });

    it('should not throw when ngOnDestroy is called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('openModal', () => {
    it('should prefill a new order with the parent business partner when adding', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1', name: 'Cliente A' } as Company;

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            businessPartnerId: 'bp1',
            businessPartnerName: 'Cliente A',
          }),
        }),
      );
    });

    it('should not overwrite the order data when editing', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1', name: 'Cliente A' } as Company;
      const order = { id: 'o1' };

      // Act
      component.openModal({ isEdit: true, data: order });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: order }),
      );
    });
  });

  describe('deleteOrder', () => {
    it('should purge the grid cache when deletion succeeds at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      orderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteOrder({ id: 'o1' } as Order);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should remove the order from the filtered rows when deletion succeeds while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.filteredRowData = [{ id: 'o1' } as Order, { id: 'o2' } as Order];
      orderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteOrder({ id: 'o1' } as Order);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 'o2' }]);
    });

    it('should not touch the grid or rows but still notify when the deletion fails', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      orderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteOrder({ id: 'o1' } as Order);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Falha',
        ResponseStatus.Error,
      );
    });
  });

  describe('refreshOrders', () => {
    it('should just show a notification when called at the top level', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshOrders();

      // Assert
      expect(orderServiceMock.getAll).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'ORDERS.ORDERS_REFRESHED',
      );
    });

    it('should reload orders for the business partner when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      orderServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshOrders();

      // Assert
      expect(orderServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'ORDERS.ORDERS_REFRESHED',
      );
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
        { id: 'o1', status: 'Open', createDate: '2024-01-01' } as unknown as Order,
        { id: 'o2', status: 'Closed', createDate: '2024-01-02' } as unknown as Order,
      ];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((o) => o.id)).toEqual(['o1']);
    });

    it('should treat a missing status as an empty string when filtering by status while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [{ id: 'o1' } as unknown as Order];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });

    it('should filter client-side rows by date range when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'o1', createDate: '2024-01-01' } as unknown as Order,
        { id: 'o2', createDate: '2024-02-01' } as unknown as Order,
      ];
      component.filterStartDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((o) => o.id)).toEqual(['o2']);
    });

    it('should filter client-side rows by end date only when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'o1', createDate: '2024-01-01' } as unknown as Order,
        { id: 'o2', createDate: '2024-02-01' } as unknown as Order,
      ];
      component.filterEndDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((o) => o.id)).toEqual(['o1']);
    });

    it('should exclude rows with no createDate when a date filter is active while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'o1' } as unknown as Order,
        { id: 'o2', createDate: '2024-01-01' } as unknown as Order,
      ];
      component.filterStartDate = '2024-01-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((o) => o.id)).toEqual(['o2']);
    });

    it('should reset state and reapply filters when clearFilters is called while embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [{ id: 'o1' } as Order];
      component.filterStatus.Open = true;

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterStatus).toEqual({
        Open: false,
        WaitingPayment: false,
        Closed: false,
      });
      expect(component.filteredRowData).toEqual([{ id: 'o1' }]);
    });

    it('should purge the grid cache without touching filteredRowData when clearFilters is called at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.filterStatus.Open = true;

      // Act
      component.clearFilters();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
      expect(component.filterStatus).toEqual({
        Open: false,
        WaitingPayment: false,
        Closed: false,
      });
    });
  });

  describe('pagedDataSource', () => {
    it('should forward the active filters to the paged request when pagedDataSource is called', () => {
      // Arrange
      const component = createComponent();
      component.filterStartDate = '2024-01-01';
      component.filterEndDate = '2024-01-31';
      component.filterStatus.Closed = true;

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(orderServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          statuses: ['Closed'],
        }),
      );
    });

    it('should fall back to undefined dates when no date filter is set', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(orderServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: undefined, endDate: undefined, statuses: [] }),
      );
    });
  });

  describe('getOrders (private, via ngOnInit/refreshOrders)', () => {
    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      orderServiceMock.getByBusinessPartnerId.mockReturnValue(of({}));

      // Act
      component.refreshOrders();

      // Assert
      expect(component.rowData).toEqual([]);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      orderServiceMock.getByBusinessPartnerId.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.refreshOrders();

      // Assert
      expect(component.loading).toBe(false);
    });

    it('should run without a callback when called directly with none', () => {
      // Arrange
      const component = createComponent();
      orderServiceMock.getAll.mockReturnValue(of({ data: [] }));

      // Act
      // Assert
      expect(() => (component as any).getOrders()).not.toThrow();
    });
  });

  describe('column defs cell renderers', () => {
    it('should render the orderNumber value as a link and fall back to an empty string when the value is null', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'orderNumber')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '123' })).toContain('123');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should render the businessPartnerName value as a link and fall back to an empty string when the value is null', () => {
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
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Act
      // Assert
      expect(column.hide).toBe(true);
    });

    it('should format totalPrice as BRL currency', () => {
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

    it('should format date as BR date', () => {
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
      ])('should render status %s with the %s color and translated label when the status column renders it', (status, color, label) => {
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

    it('should render the actions column buttons when the cell renderer is invoked', () => {
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

  describe('setFiltersFromQueryParams (via ngOnInit)', () => {
    it('should read status and date filters from the URL when ngOnInit runs', () => {
      // Arrange
      window.history.pushState(
        {},
        '',
        '/orders?status=Open,Closed&startDate=2024-01-01&endDate=2024-01-31',
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

    it('should leave filters empty and showFiltersOnInit false when there are no query params', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.showFiltersOnInit).toBe(false);
    });

    it('should ignore status values that are not known filter keys when reading the URL', () => {
      // Arrange
      window.history.pushState({}, '', '/orders?status=Bogus,Open');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.filterStatus.Open).toBe(true);
      expect((component.filterStatus as any).Bogus).toBeUndefined();
    });

    it('should set showFiltersOnInit true when only a status filter is active with no dates', () => {
      // Arrange
      window.history.pushState({}, '', '/orders?status=Open');
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.showFiltersOnInit).toBe(true);
    });
  });
});
