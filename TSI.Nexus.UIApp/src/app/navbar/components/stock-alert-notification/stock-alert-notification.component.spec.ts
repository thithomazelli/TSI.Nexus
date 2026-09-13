import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ModalService, Product, ProductService } from '@nexus/core';
import { StockAlertNotificationComponent } from './stock-alert-notification.component';

describe('StockAlertNotificationComponent', () => {
  let productServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): StockAlertNotificationComponent {
    productServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: [] })) };
    modalServiceMock = { showTemplateModal: vi.fn() };
    routerMock = { navigate: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };

    return new StockAlertNotificationComponent(
      productServiceMock as unknown as ProductService,
      modalServiceMock as unknown as ModalService,
      routerMock as unknown as any,
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
    it('should split products into out-of-stock and low-stock and mark for check when ngOnInit is called', () => {
      // Arrange
      const products = [
        { id: 'p1', quantityInStock: 0 },
        { id: 'p2', quantityInStock: 2 },
        { id: 'p3', quantityInStock: 10 },
        { id: 'p4', quantityInStock: -1 },
      ] as Product[];
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(of({ data: products }));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.outOfStockProducts.map((p) => p.id)).toEqual(['p1', 'p4']);
      expect(component.lowStockProducts.map((p) => p.id)).toEqual(['p2']);
      expect(component.total).toBe(3);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should treat a missing quantityInStock as out of stock when ngOnInit is called', () => {
      // Arrange
      const products = [{ id: 'p1' }] as Product[];
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(of({ data: products }));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.outOfStockProducts.map((p) => p.id)).toEqual(['p1']);
      expect(component.lowStockProducts).toEqual([]);
    });

    it('should default to empty lists when the response has no data', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(of({ data: null }));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.outOfStockProducts).toEqual([]);
      expect(component.lowStockProducts).toEqual([]);
      expect(component.total).toBe(0);
    });
  });

  describe('showBadge', () => {
    it('should show the badge only when there is at least one alerted product', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.showBadge).toBe(false);

      component.total = 1;
      expect(component.showBadge).toBe(true);
    });
  });

  it('should cap displayOutOfStockProducts and displayLowStockProducts at 10 each when there are more than 10', () => {
    // Arrange
    const component = createComponent();
    component.outOfStockProducts = Array.from(
      { length: 15 },
      (_, i) => ({ id: `o${i}` }) as Product,
    );
    component.lowStockProducts = Array.from(
      { length: 12 },
      (_, i) => ({ id: `l${i}` }) as Product,
    );

    // Act / Assert
    expect(component.displayOutOfStockProducts.length).toBe(10);
    expect(component.displayLowStockProducts.length).toBe(10);
  });

  it('should open the purchase order modal preselecting the product when openProduct is called', () => {
    // Arrange
    const component = createComponent();
    const product = { id: 'p1' } as Product;

    // Act
    component.openProduct(product);

    // Assert
    expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(expect.anything(), {
      isEdit: false,
      preselectedProductId: 'p1',
    });
  });

  it('should navigate to products filtered by low stock status when onSeeAll is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.onSeeAll();

    // Assert
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products'], {
      queryParams: { stockStatus: 'Low' },
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
