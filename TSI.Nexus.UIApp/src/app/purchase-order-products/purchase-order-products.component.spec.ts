import {
  ModalService,
  NotificationService,
  PurchaseOrderProduct,
  PurchaseOrderProductService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { PurchaseOrderProductsComponent } from './purchase-order-products.component';

describe('PurchaseOrderProductsComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let purchaseOrderProductChanged$: Subject<void>;
  let purchaseOrderProductServiceMock: {
    getByEntityId: ReturnType<typeof vi.fn>;
    purchaseOrderProductChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };

  function createComponent(): PurchaseOrderProductsComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    purchaseOrderProductChanged$ = new Subject();
    purchaseOrderProductServiceMock = {
      getByEntityId: vi.fn().mockReturnValue(of({ data: [] })),
      purchaseOrderProductChanged$,
      delete: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new PurchaseOrderProductsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      purchaseOrderProductServiceMock as unknown as PurchaseOrderProductService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the column defs and load the products', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(purchaseOrderProductServiceMock.getByEntityId).toHaveBeenCalledWith(
        'po1',
        'PurchaseOrder',
      );
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

    it('should reload whenever purchaseOrderProductChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';
      component.ngOnInit();
      purchaseOrderProductServiceMock.getByEntityId.mockClear();

      // Act
      purchaseOrderProductChanged$.next();

      // Assert
      expect(purchaseOrderProductServiceMock.getByEntityId).toHaveBeenCalledWith(
        'po1',
        'PurchaseOrder',
      );
    });

    it('should stop reacting to language/purchaseOrderProductChanged$ after ngOnDestroy', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;
      purchaseOrderProductServiceMock.getByEntityId.mockClear();

      // Act
      language$.next('en');
      purchaseOrderProductChanged$.next();

      // Assert
      expect(component.columnDefs).toBe(before);
      expect(purchaseOrderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when parentId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po2';

      // Act
      component.ngOnChanges({ parentId: { firstChange: false } as any });

      // Assert
      expect(purchaseOrderProductServiceMock.getByEntityId).toHaveBeenCalledWith(
        'po2',
        'PurchaseOrder',
      );
    });

    it('should not reload on the first change', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po2';

      // Act
      component.ngOnChanges({ parentId: { firstChange: true } as any });

      // Assert
      expect(purchaseOrderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });

    it('should do nothing when parentId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(purchaseOrderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should use the purchaseOrderId from the initial data when present', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';

      // Act
      component.openModal({ isEdit: true, data: { purchaseOrderId: 'po-from-data' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'po-from-data' }),
      );
    });

    it('should fall back to the component parentId when the initial data has none', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';

      // Act
      component.openModal({ isEdit: false, data: {} });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'po1' }),
      );
    });
  });

  describe('refresh', () => {
    it('should reload and show a success notification', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'PURCHASE_ORDER_PRODUCTS.PURCHASE_ORDER_PRODUCTS_REFRESHED',
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

  describe('deletePurchaseOrderProduct', () => {
    it('should remove the product from the grid and notify when deleted', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [
        { id: 'x1' } as PurchaseOrderProduct,
        { id: 'x2' } as PurchaseOrderProduct,
      ];
      purchaseOrderProductServiceMock.delete.mockReturnValue(of({ message: 'Removido' }));

      // Act
      component.deletePurchaseOrderProduct({ id: 'x1' } as PurchaseOrderProduct);

      // Assert
      expect(component.rowData).toEqual([{ id: 'x2' }]);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'PURCHASE_ORDER_PRODUCTS.ITEM_DELETED',
        'Removido',
        'success',
      );
    });
  });

  describe('load (private, via ngOnInit)', () => {
    it('should do nothing when there is no parentId', () => {
      // Arrange
      const component = createComponent();
      component.parentId = null;

      // Act
      component.ngOnInit();

      // Assert
      expect(purchaseOrderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';
      purchaseOrderProductServiceMock.getByEntityId.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'po1';
      purchaseOrderProductServiceMock.getByEntityId.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
    });
  });

  describe('column defs cell renderers', () => {
    it('should render the productSku as a link, falling back to an empty string', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'productSku')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'SKU1' })).toContain('SKU1');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should render the productName as a link, falling back to an empty string', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'productName')!;

      // Act
      // Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Produto A' })).toContain(
        'Produto A',
      );
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });

    it('should format totalPrice as BRL currency, falling back to R$ 0,00', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'totalPrice')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 12.5 } as any)).toBe(
        'R$ 12.50',
      );
      expect((column.valueFormatter as (p: any) => string)({ value: 0 } as any)).toBe('R$ 0,00');
      expect((column.valueFormatter as (p: any) => string)({ value: null } as any)).toBe(
        'R$ 0,00',
      );
    });

    it('should render the actions column buttons', () => {
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
