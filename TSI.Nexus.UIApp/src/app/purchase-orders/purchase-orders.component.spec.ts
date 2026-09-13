import { ChangeDetectorRef } from '@angular/core';
import {
  Company,
  ModalService,
  NotificationService,
  PurchaseOrder,
  PurchaseOrderService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { PurchaseOrdersComponent } from './purchase-orders.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('PurchaseOrdersComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let purchaseOrderChanged$: Subject<void>;
  let purchaseOrderServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    purchaseOrderChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    getByBusinessPartnerId: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): PurchaseOrdersComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    purchaseOrderChanged$ = new Subject();
    purchaseOrderServiceMock = {
      getAllPaged: vi.fn(),
      purchaseOrderChanged$,
      delete: vi.fn(),
      getAll: vi.fn().mockReturnValue(new Subject()),
      getByBusinessPartnerId: vi.fn().mockReturnValue(new Subject()),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new PurchaseOrdersComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      purchaseOrderServiceMock as unknown as PurchaseOrderService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<PurchaseOrder> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<PurchaseOrder>;
  }

  it('should create the component when instantiated', () => {
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('isTopLevelList', () => {
    it('should return true when there is no parent data', () => {
      // Assert
      expect(createComponent().isTopLevelList).toBe(true);
    });

    it('should return false when embedded under a saved parent business partner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;

      // Assert
      expect(component.isTopLevelList).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should rebuild column defs and mark for check when the language changes', () => {
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

    it('should purge the grid cache on the second purchaseOrderChanged$ emission when top-level, skipping the initial replay', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;

      // Act
      component.ngOnInit();
      purchaseOrderChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      // Act
      purchaseOrderChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should reload the purchase orders when embedded and purchaseOrderChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      purchaseOrderServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      purchaseOrderChanged$.next();

      // Assert
      expect(purchaseOrderServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });
  });

  describe('openModal', () => {
    it('should pre-fill the parent business partner when adding a new purchase order embedded in a supplier', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1', name: 'Fornecedor X' } as Company;

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ businessPartnerId: 'bp1', businessPartnerName: 'Fornecedor X' }),
        }),
      );
    });

    it('should not overwrite existing data when editing', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as Company;

      // Act
      component.openModal({ isEdit: true, data: { id: 'po1' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: true, data: { id: 'po1' } }),
      );
    });
  });

  describe('deletePurchaseOrder', () => {
    it('should purge the grid cache when the delete succeeds at the top level', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      purchaseOrderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deletePurchaseOrder({ id: 'po1' } as PurchaseOrder);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should remove the purchase order from the filtered rows and mark for check when the embedded delete succeeds', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.filteredRowData = [
        { id: 'po1' } as PurchaseOrder,
        { id: 'po2' } as PurchaseOrder,
      ];
      purchaseOrderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deletePurchaseOrder({ id: 'po1' } as PurchaseOrder);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 'po2' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not purge the cache or filter rows when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.filteredRowData = [{ id: 'po1' } as PurchaseOrder];
      purchaseOrderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deletePurchaseOrder({ id: 'po1' } as PurchaseOrder);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(component.filteredRowData).toEqual([{ id: 'po1' }]);
    });
  });

  describe('refreshPurchaseOrders', () => {
    it('should show a refresh notification without reloading when the list is top-level', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshPurchaseOrders();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'PURCHASE_ORDERS.PURCHASE_ORDERS_REFRESHED',
      );
      expect(purchaseOrderServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should reload and mark for check when embedded', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      purchaseOrderServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({ data: [] }),
      );

      // Act
      component.refreshPurchaseOrders();

      // Assert
      expect(purchaseOrderServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('applyFilters / clearFilters (embedded)', () => {
    it('should filter client-side rows by status when applyFilters is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [
        { id: 'po1', status: 'Open', createDate: '2024-01-01' } as unknown as PurchaseOrder,
        { id: 'po2', status: 'Closed', createDate: '2024-01-02' } as unknown as PurchaseOrder,
      ];
      component.filterStatus.Open = true;

      // Act
      component.applyFilters();

      // Assert
      expect(component.filteredRowData.map((p) => p.id)).toEqual(['po1']);
    });

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

    it('should reset the filter and filtered-row state when clearFilters is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      component.rowData = [{ id: 'po1' } as PurchaseOrder];
      component.filterStatus.Open = true;

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterStatus).toEqual({ Open: false, WaitingPayment: false, Closed: false });
      expect(component.filteredRowData).toEqual([{ id: 'po1' }]);
    });

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

  describe('pagedDataSource', () => {
    it('should forward the active status filters when pagedDataSource is called', () => {
      // Arrange
      const component = createComponent();
      component.filterStatus.Closed = true;

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(purchaseOrderServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: ['Closed'] }),
      );
    });
  });

  describe('getPurchaseOrders (private, via ngOnInit/refresh/purchaseOrderChanged$)', () => {
    it('should fetch all purchase orders and mark for check when there is no scoped parent', () => {
      // Arrange
      const component = createComponent();
      purchaseOrderServiceMock.getAll.mockReturnValue(of({ data: [{ id: 'po1' } as PurchaseOrder] }));

      // Act
      (component as any).getPurchaseOrders();

      // Assert
      expect(purchaseOrderServiceMock.getAll).toHaveBeenCalled();
      expect(component.rowData).toEqual([{ id: 'po1' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      purchaseOrderServiceMock.getByBusinessPartnerId.mockReturnValue(of({} as WebApiResponse<PurchaseOrder[]>));

      // Act
      (component as any).getPurchaseOrders();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.parentData = { id: 'bp1' } as Company;
      purchaseOrderServiceMock.getByBusinessPartnerId.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      (component as any).getPurchaseOrders();

      // Assert
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when ngOnDestroy completes the destroy subject and unsubscribes the purchase-order-changed subscription', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when ngOnDestroy is called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('column defs', () => {
    it('should render the purchase order number as a link', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'purchaseOrderNumber')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: '#1' });

      // Assert
      expect(html).toContain('#1');
    });

    it('should render the status badge with the mapped color and label for Open, Closed and WaitingPayment', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Open' })).toContain('bg-info');
      expect((column.cellRenderer as (p: any) => string)({ value: 'Closed' })).toContain('bg-success');
      expect((column.cellRenderer as (p: any) => string)({ value: 'WaitingPayment' })).toContain('bg-warning');
    });

    it('should fall back to a secondary badge with the raw value when the status is unknown', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'status')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: 'Unknown' });

      // Assert
      expect(html).toContain('bg-secondary');
      expect(html).toContain('Unknown');
    });

    it('should hide the businessPartnerName column when entity is BusinessPartner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'BusinessPartner';
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'businessPartnerName')!;

      // Assert
      expect(column.hide).toBe(true);
    });

    it('should render the actions column with view, edit and delete buttons', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as (p: any) => string)({});

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
