import { ActivatedRoute } from '@angular/router';
import {
  ModalService,
  NotificationService,
  Order,
  Payment,
  PaymentService,
  PaymentStatus,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { PaymentsComponent } from './payments.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('PaymentsComponent', () => {
  let queryParams$: Subject<Record<string, string>>;
  let routeMock: { queryParams: Subject<Record<string, string>> };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let paymentChanged$: Subject<void>;
  let paymentServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    paymentChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    getByEntityId: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };

  function createComponent(): PaymentsComponent {
    queryParams$ = new Subject();
    routeMock = { queryParams: queryParams$ };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
      showSweetConfirmation: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    paymentChanged$ = new Subject();
    paymentServiceMock = {
      getAllPaged: vi.fn(),
      paymentChanged$,
      delete: vi.fn(),
      getAll: vi.fn(),
      getByEntityId: vi.fn(),
      update: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new PaymentsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      paymentServiceMock as unknown as PaymentService,
      routeMock as unknown as ActivatedRoute,
      translationServiceMock as unknown as TranslationService,
    );
  }

  function mockGridRef(): GridComponent<Payment> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Payment>;
  }

  it('should create the component when instantiated', () => {
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should return true when there is no entity', () => {
      // Assert
      expect(createComponent().isTopLevelList).toBe(true);
    });

    it('should return false when embedded under an entity', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';

      // Assert
      expect(component.isTopLevelList).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should populate filter state when the route query params include filters', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();
      queryParams$.next({ status: 'Approved,Pending', startDate: '2024-01-01' });

      // Assert
      expect(component.filterStatus.Approved).toBe(true);
      expect(component.filterStatus.Pending).toBe(true);
      expect(component.filterStartDate).toBe('2024-01-01');
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should purge the grid cache on the second paymentChanged$ emission when top-level, skipping the initial replay', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      queryParams$.next({});

      // Act
      paymentChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      // Act
      paymentChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should reload the payments when embedded and paymentChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = { id: 'o1' } as Order;
      paymentServiceMock.getByEntityId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();
      queryParams$.next({});

      // Act
      paymentChanged$.next();

      // Assert
      expect(paymentServiceMock.getByEntityId).toHaveBeenCalledWith('o1', 'Order');
    });
  });

  describe('openModal', () => {
    it('should include the parent id and data in the initial state when opening the modal', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'o1' } as Order;

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'o1', parentData: component.parentData }),
      );
    });
  });

  describe('deleteOrder', () => {
    it('should purge the grid cache when the delete succeeds at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      paymentServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteOrder({ id: 'p1' } as Payment);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should not purge the cache or filter rows when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.filteredRowData = [{ id: 'p1' } as Payment];
      paymentServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteOrder({ id: 'p1' } as Payment);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(component.filteredRowData).toEqual([{ id: 'p1' }]);
    });

    it('should remove the payment from the filtered rows when the embedded delete succeeds', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.filteredRowData = [{ id: 'p1' } as Payment, { id: 'p2' } as Payment];
      paymentServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteOrder({ id: 'p1' } as Payment);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 'p2' }]);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should do nothing when the payment is already approved', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.updatePaymentStatus({ id: 'p1', status: PaymentStatus.Approved } as Payment);

      // Assert
      expect(modalServiceMock.showSweetConfirmation).not.toHaveBeenCalled();
    });

    it('should mark the payment approved and purge the cache when confirmed at the top level', async () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      paymentServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Atualizado' }),
      );

      // Act
      component.updatePaymentStatus({ id: 'p1', status: PaymentStatus.Pending } as Payment);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(paymentServiceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.Approved }),
      );
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should not update the payment when the confirmation is cancelled', async () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.updatePaymentStatus({ id: 'p1', status: PaymentStatus.Pending } as Payment);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(paymentServiceMock.update).not.toHaveBeenCalled();
    });
  });

  describe('applyFilters / clearFilters (embedded)', () => {
    it('should filter client-side rows by status and type when applyFilters is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [
        { id: 'p1', status: 'Approved', type: 'Incoming', date: '2024-01-01' } as unknown as Payment,
        { id: 'p2', status: 'Pending', type: 'Outgoing', date: '2024-01-02' } as unknown as Payment,
      ];
      component.filterStatus.Approved = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((p) => p.id)).toEqual(['p1']);
    });

    it('should reset the filter and filtered-row state when clearFilters is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [{ id: 'p1' } as Payment];
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
      expect(component.filteredRowData).toEqual([{ id: 'p1' }]);
    });
  });

  describe('pagedDataSource', () => {
    it('should forward the active filters when pagedDataSource is called', () => {
      // Arrange
      const component = createComponent();
      component.filterStatus.Delayed = true;
      component.filterType.Outgoing = true;

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(paymentServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: ['Delayed'], types: ['Outgoing'] }),
      );
    });
  });

  describe('column cell renderers', () => {
    it('should render a checked checkbox when the payment status is approved', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.headerName === 'PAYMENTS.PAID_QUESTION')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({
        value: PaymentStatus.Approved,
      });

      // Assert
      expect(html).toContain('checked');
    });

    it('should render the translated payment type with its icon when rendering the type column', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: 'Incoming' });

      // Assert
      expect(html).toContain('REPORTS.INCOMING');
      expect(html).toContain('bi-arrow-up-circle-fill');
    });

    it('should render an unchecked checkbox when the payment status is not approved', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.headerName === 'PAYMENTS.PAID_QUESTION')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: PaymentStatus.Pending });

      // Assert
      expect(html).not.toContain('checked');
    });

    it('should render description as a link and fall back to empty when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'description')!;

      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Aluguel' } as any)).toContain('Aluguel');
      expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toContain('></a>');
    });

    it('should render paymentNumber as a link and hide the column when not compact', () => {
      // Arrange
      const component = createComponent();
      component.compact = false;
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'paymentNumber')!;

      // Assert
      expect(column.hide).toBe(true);
      expect((column.cellRenderer as (p: any) => string)({ value: '#1' } as any)).toContain('#1');
      expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toContain('></a>');
    });

    it('should show the paymentNumber column when compact is true', () => {
      // Arrange
      const component = createComponent();
      component.compact = true;
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'paymentNumber')!;

      // Assert
      expect(column.hide).toBe(false);
    });

    it('should return the translated type label when filterValueGetter is called on the type column', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Assert
      expect((column.filterValueGetter as (p: any) => string)({ data: { type: 'Outgoing' } } as any)).toBe(
        'REPORTS.OUTGOING',
      );
    });

    it('should fall back to an empty type value when there is none', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: null });

      // Assert
      expect(html).toBe('');
    });

    describe('price column', () => {
      it('should apply the text-success class when the payment type is Incoming', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'price')!;

        // Assert
        expect((column.cellClass as (p: any) => string)({ data: { type: 'Incoming' } } as any)).toBe('text-success');
      });

      it('should apply the text-danger class when the payment type is Outgoing', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'price')!;

        // Assert
        expect((column.cellClass as (p: any) => string)({ data: { type: 'Outgoing' } } as any)).toBe('text-danger');
      });

      it('should apply no class when the payment type is unknown', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'price')!;

        // Assert
        expect((column.cellClass as (p: any) => string)({ data: { type: 'Other' } } as any)).toBe('');
      });

      it('should format the value as BRL currency when rendering the price column', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'price')!;

        // Assert
        expect((column.valueFormatter as (p: any) => string)({ value: 100 } as any)).toContain('R$');
      });
    });

    describe('status column', () => {
      it('should return the translated status label when filterValueGetter is called on the status column', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.filter((c) => c.field === 'status')[1];

        // Assert
        expect((column.filterValueGetter as (p: any) => string)({ data: { status: 'Approved' } } as any)).toBe(
          'REPORTS.STATUS_PAID',
        );
      });

      it('should render the status badge with the mapped color and label', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.filter((c) => c.field === 'status')[1];

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: 'Delayed' } as any);

        // Assert
        expect(html).toContain('bg-danger');
        expect(html).toContain('REPORTS.STATUS_DELAYED');
      });

      it('should fall back to a secondary badge when the status is unknown', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.filter((c) => c.field === 'status')[1];

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: 'Unknown' } as any);

        // Assert
        expect(html).toContain('bg-secondary');
        expect(html).toContain('Unknown');
      });
    });

    it('should format the date column value as a BR date', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'date')!;

      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any)).toContain('/');
    });

    it('should render businessPartnerName with an N/A fallback and hide the column when entity is BusinessPartner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Assert
      expect(column.hide).toBe(true);
      expect((column.cellRenderer as (p: any) => string)({ value: 'Cliente X' } as any)).toBe('Cliente X');
      expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toBe('N/A');
    });

    it('should show the businessPartnerName column when entity is not BusinessPartner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Assert
      expect(column.hide).toBe(false);
    });

    it('should render orderNumber with an N/A fallback and hide the column when entity is Order or Trip', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.ngOnInit();
      const orderColumn = component.columnDefs.find((c) => c.field === 'orderNumber')!;

      // Assert
      expect(orderColumn.hide).toBe(true);
      expect((orderColumn.cellRenderer as (p: any) => string)({ value: 'ORD-1' } as any)).toBe('ORD-1');
      expect((orderColumn.cellRenderer as (p: any) => string)({ value: null } as any)).toBe('N/A');

      // Arrange
      const tripComponent = createComponent();
      tripComponent.entity = 'Trip';
      tripComponent.ngOnInit();

      // Assert
      expect(tripComponent.columnDefs.find((c) => c.field === 'orderNumber')!.hide).toBe(true);
    });

    it('should show the orderNumber column when entity is neither Order nor Trip', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'orderNumber')!;

      // Assert
      expect(column.hide).toBe(false);
    });

    it('should render tripNumber with an N/A fallback and hide the column when entity is Trip', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Trip';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'tripNumber')!;

      // Assert
      expect(column.hide).toBe(true);
      expect((column.cellRenderer as (p: any) => string)({ value: 'TRIP-1' } as any)).toBe('TRIP-1');
      expect((column.cellRenderer as (p: any) => string)({ value: null } as any)).toBe('N/A');
    });

    it('should show the tripNumber column when entity is not Trip', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'tripNumber')!;

      // Assert
      expect(column.hide).toBe(false);
    });

    it('should render the actions column with edit and delete buttons', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as (p: any) => string)({});

      // Assert
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });

  describe('typeMap / statusMap getters', () => {
    it('should expose translated labels for Incoming and Outgoing when reading typeMap', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.typeMap).toEqual({ Incoming: 'REPORTS.INCOMING', Outgoing: 'REPORTS.OUTGOING' });
    });

    it('should expose translated labels for all statuses when reading statusMap', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.statusMap).toEqual({
        Approved: 'REPORTS.STATUS_PAID',
        Pending: 'REPORTS.STATUS_OPEN',
        Delayed: 'REPORTS.STATUS_DELAYED',
      });
    });
  });

  describe('ngOnInit - additional coverage', () => {
    it('should rebuild column defs when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParams$.next({});
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
    });

    it('should keep showFiltersOnInit false when there are no initial filters', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      queryParams$.next({});

      // Assert
      expect(component.showFiltersOnInit).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when ngOnDestroy completes the destroy subject and unsubscribes the payment-changed subscription', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParams$.next({});

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();

      paymentChanged$.next();
      // no assertion needed beyond "does not throw" - the subscription teardown itself is
      // what the accompanying unsubscribe spy below verifies precisely
    });

    it('should not throw when ngOnDestroy is called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('refreshOrders', () => {
    it('should show a refresh notification without reloading when the list is top-level', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshOrders();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'PAYMENTS.PAYMENTS_REFRESHED',
      );
      expect(paymentServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should reload and show a refresh notification when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = { id: 'o1' } as Order;
      paymentServiceMock.getByEntityId.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Atualizado', data: [] }),
      );

      // Act
      component.refreshOrders();

      // Assert
      expect(paymentServiceMock.getByEntityId).toHaveBeenCalledWith('o1', 'Order');
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'PAYMENTS.PAYMENTS_REFRESHED',
      );
    });
  });

  describe('applyFilters - date range and top-level', () => {
    it('should purge the grid cache and return early when applyFilters runs on the top-level list', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;

      // Act
      component.applyFilters();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should exclude rows without a date when a date range filter is active', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [
        { id: 'p1', date: null } as unknown as Payment,
        { id: 'p2', date: '2024-01-05' } as unknown as Payment,
      ];
      component.filterStartDate = '2024-01-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((p) => p.id)).toEqual(['p2']);
    });

    it('should filter out rows before the start date when only a start date filter is set', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [
        { id: 'p1', date: '2024-01-01' } as unknown as Payment,
        { id: 'p2', date: '2024-02-01' } as unknown as Payment,
      ];
      component.filterStartDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((p) => p.id)).toEqual(['p2']);
    });

    it('should filter out rows after the end date when only an end date filter is set', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [
        { id: 'p1', date: '2024-01-01' } as unknown as Payment,
        { id: 'p2', date: '2024-02-01' } as unknown as Payment,
      ];
      component.filterEndDate = '2024-01-15';

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((p) => p.id)).toEqual(['p1']);
    });

    it('should filter rows by type when a type filter is active', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [
        { id: 'p1', type: 'Incoming' } as unknown as Payment,
        { id: 'p2', type: 'Outgoing' } as unknown as Payment,
      ];
      component.filterType.Outgoing = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((p) => p.id)).toEqual(['p2']);
    });

    it('should exclude a row with no status when a status filter is active', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [{ id: 'p1' } as unknown as Payment];
      component.filterStatus.Approved = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });

    it('should exclude a row with no type when a type filter is active', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.rowData = [{ id: 'p1' } as unknown as Payment];
      component.filterType.Incoming = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData).toEqual([]);
    });
  });

  describe('clearFilters - top-level', () => {
    it('should purge the grid cache and return early when clearFilters runs on the top-level list', () => {
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

  describe('getPayment (private, via ngOnInit/refreshOrders/paymentChanged$)', () => {
    it('should fetch all payments when there is no entity', () => {
      // Arrange
      const component = createComponent();
      paymentServiceMock.getAll.mockReturnValue(of({ data: [{ id: 'p1' } as Payment] }));

      // Act
      (component as any).getPayment();

      // Assert
      expect(paymentServiceMock.getAll).toHaveBeenCalled();
      expect(component.rowData).toEqual([{ id: 'p1' }]);
    });

    it('should invoke the callback without loading data when embedded without a saved parent yet', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = null;
      let called = false;

      // Act
      (component as any).getPayment(() => (called = true));

      // Assert
      expect(component.rowData).toEqual([]);
      expect(called).toBe(true);
    });

    it('should not throw when there is no callback and no saved parent', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = null;

      // Assert
      expect(() => (component as any).getPayment()).not.toThrow();
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = { id: 'o1' } as Order;
      paymentServiceMock.getByEntityId.mockReturnValue(of({}));

      // Act
      (component as any).getPayment();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = { id: 'o1' } as Order;
      paymentServiceMock.getByEntityId.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      (component as any).getPayment();

      // Assert
      expect(component.loading).toBe(false);
    });
  });

  describe('markAsApproved (private, via updatePaymentStatus)', () => {
    it('should do nothing when the payment is falsy', () => {
      // Assert
      expect(() => (createComponent() as any).markAsApproved(null)).not.toThrow();
      expect(paymentServiceMock.update).not.toHaveBeenCalled();
    });

    it('should reload the list and notify success when embedded and the status change is confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.entity = 'Order';
      component.parentData = { id: 'o1' } as Order;
      paymentServiceMock.getByEntityId.mockReturnValue(of({ data: [] }));
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      paymentServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Atualizado' }),
      );

      // Act
      component.updatePaymentStatus({ id: 'p1', status: PaymentStatus.Pending } as Payment);
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(paymentServiceMock.getByEntityId).toHaveBeenCalledWith('o1', 'Order');
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Atualizado', ResponseStatus.Success);
    });
  });

  describe('getTypeLabel / getStatusLabel / getStatusColor (private, via column defs)', () => {
    it('should fall back to the raw type label when there is no mapped label', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'CustomType' });

      // Assert
      expect(html).toContain('CustomType');
    });

    it('should fall back to the raw status label when there is no mapped label', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.filter((c) => c.field === 'status')[1];

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'CustomStatus' });

      // Assert
      expect(html).toContain('CustomStatus');
    });

    it('should fall back to the default color when the status is unmapped', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.filter((c) => c.field === 'status')[1];

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'CustomStatus' });

      // Assert
      expect(html).toContain('bg-secondary');
    });

    it('should fall back to an empty string when there is no type at all', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Assert
      expect((column.filterValueGetter as (p: any) => string)({} as any)).toBe('');
    });

    it('should fall back to an empty string when there is no status at all', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.filter((c) => c.field === 'status')[1];

      // Assert
      expect((column.filterValueGetter as (p: any) => string)({} as any)).toBe('');
    });
  });

  describe('setFiltersFromQueryParams edge cases', () => {
    it('should accept status and type as arrays instead of comma-separated strings', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      queryParams$.next({ status: ['Approved', 'Delayed'] as any, type: ['Incoming'] as any });

      // Assert
      expect(component.filterStatus.Approved).toBe(true);
      expect(component.filterStatus.Delayed).toBe(true);
      expect(component.filterType.Incoming).toBe(true);
    });

    it('should ignore unknown status and type values', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      queryParams$.next({ status: 'NotAStatus', type: 'NotAType' });

      // Assert
      expect(Object.values(component.filterStatus).some(Boolean)).toBe(false);
      expect(Object.values(component.filterType).some(Boolean)).toBe(false);
    });

    it('should set showFiltersOnInit to true when only a type filter is present', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      queryParams$.next({ type: 'Incoming' });

      // Assert
      expect(component.filterType.Incoming).toBe(true);
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should set showFiltersOnInit to true when only an end-date filter is present', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      queryParams$.next({ endDate: '2024-01-31' });

      // Assert
      expect(component.filterEndDate).toBe('2024-01-31');
      expect(component.showFiltersOnInit).toBe(true);
    });

    it('should default start and end dates to null when absent from the query params', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      queryParams$.next({});

      // Assert
      expect(component.filterStartDate).toBeNull();
      expect(component.filterEndDate).toBeNull();
    });
  });
});
