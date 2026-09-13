import {
  ModalService,
  NotificationService,
  OrderProduct,
  OrderProductService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { OrderProductsComponent } from './order-products.component';

describe('OrderProductsComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let orderProductChanged$: Subject<void>;
  let orderProductServiceMock: {
    getByEntityId: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    orderProductChanged$: Subject<void>;
  };
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };

  function createComponent(): OrderProductsComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    orderProductChanged$ = new Subject();
    orderProductServiceMock = {
      getByEntityId: vi.fn().mockReturnValue(new Subject()),
      delete: vi.fn(),
      orderProductChanged$,
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new OrderProductsComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      orderProductServiceMock as unknown as OrderProductService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the columns and load data for the current parentId, reacting to language and orderProductChanged$', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'o1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(orderProductServiceMock.getByEntityId).toHaveBeenCalledWith('o1', 'Order');

      // Act
      const columnsBefore = component.columnDefs;
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(columnsBefore);

      // Act
      orderProductServiceMock.getByEntityId.mockClear();
      orderProductChanged$.next();

      // Assert
      expect(orderProductServiceMock.getByEntityId).toHaveBeenCalledWith('o1', 'Order');
    });

    it('should hide the SKU/product columns and show order/client columns when viewed from the product history tab', () => {
      // Arrange
      const component = createComponent();
      component.isFromProductsView = true;

      // Act
      component.ngOnInit();

      // Assert
      const skuColumn = component.columnDefs.find((c) => c.field === 'productSku');
      const orderColumn = component.columnDefs.find((c) => c.field === 'orderNumber');
      expect(skuColumn?.hide).toBe(true);
      expect(orderColumn?.hide).toBe(false);
    });

    it('should fall back to an empty value when the sku/product cellRenderers receive no value', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      const skuColumn = component.columnDefs.find((c) => c.field === 'productSku');
      const nameColumn = component.columnDefs.find((c) => c.field === 'productName');

      expect((skuColumn?.cellRenderer as (p: unknown) => string)({ value: 'SKU-1' })).toContain('SKU-1');
      expect((skuColumn?.cellRenderer as (p: unknown) => string)({ value: undefined })).toContain('>');
      expect((nameColumn?.cellRenderer as (p: unknown) => string)({ value: 'Produto X' })).toContain('Produto X');
      expect((nameColumn?.cellRenderer as (p: unknown) => string)({ value: undefined })).toContain('>');
    });

    it('should fall back to N/A when the orderNumber cellRenderer receives no value', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      const orderColumn = component.columnDefs.find((c) => c.field === 'orderNumber');

      expect((orderColumn?.cellRenderer as (p: unknown) => string)({ value: 'PED-1' })).toContain('PED-1');
      expect((orderColumn?.cellRenderer as (p: unknown) => string)({ value: undefined })).toContain('N/A');
    });

    it('should format the amount or fall back to R$ 0,00 when the totalPrice valueFormatter runs', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      const totalColumn = component.columnDefs.find((c) => c.field === 'totalPrice');
      const formatter = totalColumn?.valueFormatter as (p: { value: number }) => string;

      expect(formatter({ value: 150 })).toBe('R$ 150.00');
      expect(formatter({ value: 0 })).toBe('R$ 0,00');
    });

    it('should include the delete button in the actions column only outside the product history tab', () => {
      // Arrange
      const component = createComponent();
      component.isFromProductsView = false;

      // Act
      component.ngOnInit();

      // Assert
      const actionsColumn = component.columnDefs.find((c) => c.headerName === 'COMMON.ACTIONS');
      const withDelete = (actionsColumn?.cellRenderer as () => string)();
      expect(withDelete).toContain('data-action="delete"');

      // Act
      component.isFromProductsView = true;
      component.ngOnInit();

      // Assert
      const readOnlyColumn = component.columnDefs.find((c) => c.headerName === 'COMMON.ACTIONS');
      const withoutDelete = (readOnlyColumn?.cellRenderer as () => string)();
      expect(withoutDelete).not.toContain('data-action="delete"');
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when parentId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'o2';

      // Act
      component.ngOnChanges({ parentId: { firstChange: false } } as unknown as SimpleChanges);

      // Assert
      expect(orderProductServiceMock.getByEntityId).toHaveBeenCalledWith('o2', 'Order');
    });

    it('should not reload when the change is the first change', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'o2';

      // Act
      component.ngOnChanges({ parentId: { firstChange: true } } as unknown as SimpleChanges);

      // Assert
      expect(orderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });

    it('should do nothing when parentId is not part of the changes', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'o2';

      // Act
      component.ngOnChanges({} as SimpleChanges);

      // Assert
      expect(orderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
    });
  });

  it('should not fetch when there is no parentId', () => {
    // Arrange
    const component = createComponent();
    component.parentId = null;

    // Act
    component.ngOnInit();

    // Assert
    expect(orderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
  });

  it('should fetch by product id and stop loading without a refresh notification on a plain load', () => {
    // Arrange
    const component = createComponent();
    component.parentId = 'p1';
    component.isFromProductsView = true;
    const response$ = new Subject<WebApiResponse<OrderProduct[]>>();
    orderProductServiceMock.getByEntityId.mockReturnValue(response$);

    // Act
    component.ngOnInit();

    // Assert
    expect(component.loading).toBe(true);

    // Act
    response$.next({ data: [{ id: 'op1' } as OrderProduct] } as WebApiResponse<OrderProduct[]>);

    // Assert
    expect(orderProductServiceMock.getByEntityId).toHaveBeenCalledWith('p1', 'Product');
    expect(component.rowData).toEqual([{ id: 'op1' }]);
    expect(component.loading).toBe(false);
    expect(notificationServiceMock.showMessage).not.toHaveBeenCalled();
  });

  it('should fall back to an empty list when the response has no data', () => {
    // Arrange
    const component = createComponent();
    component.parentId = 'o1';
    const response$ = new Subject<WebApiResponse<OrderProduct[]>>();
    orderProductServiceMock.getByEntityId.mockReturnValue(response$);

    // Act
    component.ngOnInit();
    response$.next({} as WebApiResponse<OrderProduct[]>);

    // Assert
    expect(component.rowData).toEqual([]);
  });

  it('should reload and show a success notification once the data arrives when refresh is called', () => {
    // Arrange
    const component = createComponent();
    component.parentId = 'o1';
    const response$ = new Subject<WebApiResponse<OrderProduct[]>>();
    orderProductServiceMock.getByEntityId.mockReturnValue(response$);

    // Act
    component.refresh();
    response$.next({ data: [] } as unknown as WebApiResponse<OrderProduct[]>);

    // Assert
    expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
      ResponseStatus.Success,
      'ORDER_PRODUCTS.ORDER_PRODUCTS_REFRESHED',
    );
  });

  it('should stop loading when the request errors', () => {
    // Arrange
    const component = createComponent();
    component.parentId = 'o1';
    const response$ = new Subject<WebApiResponse<OrderProduct[]>>();
    orderProductServiceMock.getByEntityId.mockReturnValue(response$);

    // Act
    component.ngOnInit();
    response$.error(new Error('fail'));

    // Assert
    expect(component.loading).toBe(false);
  });

  it('should do nothing when noop is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    const act = () => component.noop();

    // Assert
    expect(act).not.toThrow();
  });

  describe('openModal', () => {
    it('should use the orderId from the modal data when present', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'o1';

      // Act
      component.openModal({ data: { orderId: 'o2' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'o2' }),
      );
    });

    it('should fall back to the component parentId when the modal data has none', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'o1';

      // Act
      component.openModal({});

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parentId: 'o1' }),
      );
    });
  });

  it('should remove the item, hide the modal, and show a success notification when deleteOrderProduct is called', () => {
    // Arrange
    const component = createComponent();
    component.rowData = [{ id: 'op1' } as OrderProduct, { id: 'op2' } as OrderProduct];
    const deleteResponse$ = new Subject<WebApiResponse<OrderProduct>>();
    orderProductServiceMock.delete.mockReturnValue(deleteResponse$);

    // Act
    component.deleteOrderProduct({ id: 'op1' } as OrderProduct);
    deleteResponse$.next({ message: 'removido' } as WebApiResponse<OrderProduct>);

    // Assert
    expect(component.rowData).toEqual([{ id: 'op2' }]);
    expect(modalServiceMock.hideModal).toHaveBeenCalled();
    expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
      'ORDER_PRODUCTS.ITEM_DELETED',
      'removido',
      'success',
    );
  });

  it('should complete the destroy subject so subscriptions stop reacting when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();
    component.parentId = 'o1';
    component.ngOnInit();

    // Act
    component.ngOnDestroy();
    orderProductServiceMock.getByEntityId.mockClear();
    orderProductChanged$.next();

    // Assert
    expect(orderProductServiceMock.getByEntityId).not.toHaveBeenCalled();
  });
});
