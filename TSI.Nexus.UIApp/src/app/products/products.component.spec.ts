import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ModalService,
  NotificationService,
  Product,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of } from 'rxjs';
import { ProductsComponent } from './products.component';
import { ProductService } from '../core/services/product/product.service';
import { GridComponent } from '../shared/grid/grid.component';

describe('ProductsComponent', () => {
  let activatedRouteMock: { snapshot: { queryParamMap: { get: ReturnType<typeof vi.fn> } } };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let productChanged$: Subject<void>;
  let productServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    productChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(stockStatus: string | null = null): ProductsComponent {
    activatedRouteMock = {
      snapshot: { queryParamMap: { get: vi.fn().mockReturnValue(stockStatus) } },
    };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    productChanged$ = new Subject();
    productServiceMock = {
      getAllPaged: vi.fn(),
      productChanged$,
      delete: vi.fn(),
      refresh: vi.fn(),
    };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new ProductsComponent(
      activatedRouteMock as unknown as ActivatedRoute,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      productServiceMock as unknown as ProductService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<Product> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<Product>;
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should rebuild the column definitions when the language changes', () => {
    // Arrange
    const component = createComponent();
    const before = component.columnDefs;

    // Act
    language$.next('en');

    // Assert
    expect(component.columnDefs).not.toBe(before);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  describe('ngOnInit', () => {
    it('should read the stockStatus query param and forward lowStockOnly to the paged request', () => {
      // Arrange
      const component = createComponent('Low');
      component.ngOnInit();

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(productServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ lowStockOnly: true }),
      );
    });

    it('should default lowStockOnly to false when there is no query param', () => {
      // Arrange
      const component = createComponent(null);
      component.ngOnInit();

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(productServiceMock.getAllPaged).toHaveBeenCalledWith(
        expect.objectContaining({ lowStockOnly: false }),
      );
    });

    it('should ignore the first (replay) emission but purge the cache on later changes', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      productChanged$.next();
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      productChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should stop reacting when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      productChanged$.next();
      productChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('openModal', () => {
    it('should open the product details modal when called', () => {
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

  describe('deleteProduct', () => {
    it('should purge the grid cache and notify when the deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      productServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteProduct({ id: 'p1' } as Product);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should not purge the cache when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      productServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteProduct({ id: 'p1' } as Product);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('refreshProducts', () => {
    it('should refresh the shared cache and show a notification when called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshProducts();

      // Assert
      expect(productServiceMock.refresh).toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'PRODUCTS.PRODUCTS_REFRESHED',
      );
    });
  });

  describe('column cell renderers', () => {
    it('should render the sku and name as links, falling back to empty when the value is missing', () => {
      // Arrange
      const component = createComponent();
      const skuColumn = component.columnDefs.find((c) => c.field === 'sku')!;
      const nameColumn = component.columnDefs.find((c) => c.field === 'name')!;

      // Act / Assert
      expect((skuColumn.cellRenderer as (params: any) => string)({ value: 'SKU1' })).toContain(
        'SKU1',
      );
      expect((skuColumn.cellRenderer as (params: any) => string)({ value: null })).toContain(
        'ag-link',
      );
      expect(
        (nameColumn.cellRenderer as (params: any) => string)({ value: 'Produto 1' }),
      ).toContain('Produto 1');
      expect((nameColumn.cellRenderer as (params: any) => string)({ value: null })).toContain(
        'ag-link',
      );
    });

    it('should show an "available" badge for an in-stock, non-service product', () => {
      // Arrange
      const component = createComponent();
      const statusColumn = component.columnDefs.find((c) => c.headerName === 'COMMON.STATUS')!;

      // Act
      const html = (statusColumn.cellRenderer as (params: any) => string)({
        value: 5,
        data: { type: 'Sale' },
      });

      // Assert
      expect(html).toContain('bg-success');
    });

    it('should format the price column with formatCurrencyBRL when rendered', () => {
      // Arrange
      const component = createComponent();
      const priceColumn = component.columnDefs.find((c) => c.field === 'price')!;

      // Act
      const formatted = (priceColumn.valueFormatter as (params: any) => string)({
        value: 1234.5,
      });

      // Assert
      expect(typeof formatted).toBe('string');
    });

    it('should render the action buttons column when rendered', () => {
      // Arrange
      const component = createComponent();
      const actionsColumn = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (actionsColumn.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });

    it('should expose filterValueGetter for unit and type matching the cell renderer output', () => {
      // Arrange
      const component = createComponent();
      const unitColumn = component.columnDefs.find((c) => c.field === 'unit')!;
      const typeColumn = component.columnDefs.find((c) => c.field === 'type')!;

      // Act / Assert
      expect(
        (unitColumn.filterValueGetter as (params: any) => string)({ data: { unit: 'Unit' } }),
      ).toBe('PRODUCTS.UNIT_UNIT');
      expect(
        (typeColumn.filterValueGetter as (params: any) => string)({ data: { type: 'Sale' } }),
      ).toBe('PRODUCTS.TYPE_SALE');
    });

    it('should fall back to an empty string when the unit/type is nullish', () => {
      // Arrange
      const component = createComponent();
      const unitColumn = component.columnDefs.find((c) => c.field === 'unit')!;
      const typeColumn = component.columnDefs.find((c) => c.field === 'type')!;

      // Act / Assert
      expect(
        (unitColumn.cellRenderer as (params: any) => string)({ data: { unit: undefined } }),
      ).toBe('');
      expect(
        (typeColumn.cellRenderer as (params: any) => string)({ data: { type: undefined } }),
      ).toBe('');
    });

    it('should show an "available" badge for a service regardless of stock', () => {
      // Arrange
      const component = createComponent();
      const statusColumn = component.columnDefs.find((c) => c.headerName === 'COMMON.STATUS')!;

      // Act
      const html = (statusColumn.cellRenderer as (params: any) => string)({
        value: 0,
        data: { type: 'Service' },
      });

      // Assert
      expect(html).toContain('bg-success');
    });

    it('should show an "unavailable" badge when a non-service product is out of stock', () => {
      // Arrange
      const component = createComponent();
      const statusColumn = component.columnDefs.find((c) => c.headerName === 'COMMON.STATUS')!;

      // Act
      const html = (statusColumn.cellRenderer as (params: any) => string)({
        value: 0,
        data: { type: 'Sale' },
      });

      // Assert
      expect(html).toContain('bg-danger');
    });

    it('should translate a known unit and fall back to the raw value otherwise', () => {
      // Arrange
      const component = createComponent();
      const unitColumn = component.columnDefs.find((c) => c.field === 'unit')!;

      // Act / Assert
      expect(
        (unitColumn.cellRenderer as (params: any) => string)({ data: { unit: 'Unit' } }),
      ).toBe('PRODUCTS.UNIT_UNIT');
      expect(
        (unitColumn.cellRenderer as (params: any) => string)({ data: { unit: 'Weird' } }),
      ).toBe('Weird');
    });

    it('should translate a known type and fall back to the raw value otherwise', () => {
      // Arrange
      const component = createComponent();
      const typeColumn = component.columnDefs.find((c) => c.field === 'type')!;

      // Act / Assert
      expect(
        (typeColumn.cellRenderer as (params: any) => string)({ data: { type: 'Sale' } }),
      ).toBe('PRODUCTS.TYPE_SALE');
      expect(
        (typeColumn.cellRenderer as (params: any) => string)({ data: { type: 'Weird' } }),
      ).toBe('Weird');
    });
  });
});
