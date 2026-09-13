import { ActivatedRoute } from '@angular/router';
import {
  ModalService,
  NotificationService,
  QuoteProduct,
  QuoteProductService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { QuoteProductsComponent } from './quote-products.component';

describe('QuoteProductsComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let quoteProductChanged$: Subject<void>;
  let quoteProductServiceMock: {
    quoteProductChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    getByEntityId: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): QuoteProductsComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    quoteProductChanged$ = new Subject();
    quoteProductServiceMock = {
      quoteProductChanged$,
      delete: vi.fn(),
      getAll: vi.fn(),
      getByEntityId: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new QuoteProductsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      quoteProductServiceMock as unknown as QuoteProductService,
      {} as ActivatedRoute,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the grid, react, and mark for check when the language changes', () => {
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

    it('should reload the full list and mark for check when quoteProductChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      quoteProductServiceMock.getAll.mockReturnValue(of({ data: [{ id: 'qp1' }] }));
      component.ngOnInit();

      // Act
      quoteProductChanged$.next();

      // Assert
      expect(quoteProductServiceMock.getAll).toHaveBeenCalled();
      expect(component.rowData).toEqual([{ id: 'qp1' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should stop reloading when ngOnDestroy has been called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      quoteProductChanged$.next();

      // Assert
      expect(quoteProductServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should not throw when ngOnDestroy is called before ngOnInit', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('getQuoteProducts (via ngOnInit trigger)', () => {
    it('should do nothing when there is no parentId and it is not the full list', () => {
      // Arrange
      const component = createComponent();
      component.isFullList = false;
      component.parentId = null;
      component.ngOnInit();

      // Act
      quoteProductChanged$.next();

      // Assert
      expect(quoteProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });

    it('should fetch by entity id as Order when scoped and not from the products view', () => {
      // Arrange
      const component = createComponent();
      component.isFullList = false;
      component.parentId = 'o1';
      component.isFromProductsView = false;
      quoteProductServiceMock.getByEntityId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      quoteProductChanged$.next();

      // Assert
      expect(quoteProductServiceMock.getByEntityId).toHaveBeenCalledWith('o1', 'Order');
    });

    it('should fetch by entity id as Product when scoped from the products view', () => {
      // Arrange
      const component = createComponent();
      component.isFullList = false;
      component.parentId = 'p1';
      component.isFromProductsView = true;
      quoteProductServiceMock.getByEntityId.mockReturnValue(of({ data: [] }));
      component.ngOnInit();

      // Act
      quoteProductChanged$.next();

      // Assert
      expect(quoteProductServiceMock.getByEntityId).toHaveBeenCalledWith('p1', 'Product');
    });

    it('should fall back to an empty array and mark for check when the response carries no data', () => {
      // Arrange
      const component = createComponent();
      quoteProductServiceMock.getAll.mockReturnValue(of({}));
      component.ngOnInit();

      // Act
      quoteProductChanged$.next();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should stop loading and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      quoteProductServiceMock.getAll.mockReturnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      // Act
      // Assert
      expect(() => quoteProductChanged$.next()).not.toThrow();

      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('openModal', () => {
    it('should use the order id from the row data when present', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'fallback';

      // Act
      component.openModal({ isEdit: true, data: { orderId: 'o1' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'o1' }),
      );
    });

    it('should fall back to the component parentId when the row data has no order id', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'fallback';

      // Act
      component.openModal({ isEdit: false, data: {} });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'fallback' }),
      );
    });
  });

  describe('deleteQuoteProduct', () => {
    it('should remove the item from the filtered rows, notify, and mark for check when deleteQuoteProduct succeeds', () => {
      // Arrange
      const component = createComponent();
      component.filteredRowData = [{ id: 'qp1' } as QuoteProduct, { id: 'qp2' } as QuoteProduct];
      quoteProductServiceMock.delete.mockReturnValue(of({ message: 'Removido' }));

      // Act
      component.deleteQuoteProduct({ id: 'qp1' } as QuoteProduct);

      // Assert
      expect(component.filteredRowData).toEqual([{ id: 'qp2' }]);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'QUOTES.ITEM_DELETED',
        'Removido',
        'success',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('refreshQuoteProducts', () => {
    it('should reload, notify, and mark for check when refreshQuoteProducts succeeds', () => {
      // Arrange
      const component = createComponent();
      component.isFullList = true;
      quoteProductServiceMock.getAll.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshQuoteProducts();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'QUOTES.QUOTE_PRODUCTS_REFRESHED',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('total price column formatter', () => {
    it('should format a value in BRL when the totalPrice formatter runs', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'totalPrice')!;

      // Act
      // Assert
      expect((column.valueFormatter as (params: any) => string)({ value: 12.5 })).toBe(
        'R$ 12.50',
      );
    });

    it('should fall back to R$ 0,00 when the value is falsy', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'totalPrice')!;

      // Act
      // Assert
      expect((column.valueFormatter as (params: any) => string)({ value: 0 })).toBe('R$ 0,00');
    });
  });

  describe('productSku/productName cell renderers', () => {
    it('should render the value as an edit link when the cell renderer runs', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const sku = component.columnDefs.find((c) => c.field === 'productSku')!;
      const name = component.columnDefs.find((c) => c.field === 'productName')!;

      // Act
      // Assert
      expect((sku.cellRenderer as (params: any) => string)({ value: 'SKU-1' })).toBe(
        '<a data-action="edit" class="ag-link">SKU-1</a>',
      );
      expect((name.cellRenderer as (params: any) => string)({ value: 'Produto A' })).toBe(
        '<a data-action="edit" class="ag-link">Produto A</a>',
      );
    });

    it('should fall back to an empty string when the value is falsy', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const sku = component.columnDefs.find((c) => c.field === 'productSku')!;
      const name = component.columnDefs.find((c) => c.field === 'productName')!;

      // Act
      // Assert
      expect((sku.cellRenderer as (params: any) => string)({ value: null })).toBe(
        '<a data-action="edit" class="ag-link"></a>',
      );
      expect((name.cellRenderer as (params: any) => string)({ value: null })).toBe(
        '<a data-action="edit" class="ag-link"></a>',
      );
    });
  });

  describe('actions column cell renderer', () => {
    it('should include the delete button when not viewed from the products screen', () => {
      // Arrange
      const component = createComponent();
      component.isFromProductsView = false;
      component.ngOnInit();
      const actions = component.columnDefs.find((c) => c.headerName === 'COMMON.ACTIONS')!;

      // Act
      const html = (actions.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });

    it('should omit the delete button when viewed from the products screen', () => {
      // Arrange
      const component = createComponent();
      component.isFromProductsView = true;
      component.ngOnInit();
      const actions = component.columnDefs.find((c) => c.headerName === 'COMMON.ACTIONS')!;

      // Act
      const html = (actions.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="edit"');
      expect(html).not.toContain('data-action="delete"');
    });
  });
});
