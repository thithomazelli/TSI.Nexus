import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductService, ProductType, TranslationService } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { ProductDetailsPageComponent } from './product-details-page.component';

describe('ProductDetailsPageComponent', () => {
  let paramMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { paramMap: Subject<{ get: (key: string) => string | null }> };
  let productServiceMock: { getById: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(): ProductDetailsPageComponent {
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    productServiceMock = { getById: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new ProductDetailsPageComponent(
      activatedRouteMock as unknown as ActivatedRoute,
      productServiceMock as unknown as ProductService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
    );
  }

  function paramMap(entries: Record<string, string | null>) {
    return { get: (key: string) => entries[key] ?? null };
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should stay in add mode when the route param is "new"', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap({ id: 'new' }));

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
      expect(productServiceMock.getById).not.toHaveBeenCalled();
    });

    it('should load the product when a real id is provided', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getById.mockReturnValue(
        of({ data: { id: 'p1', type: ProductType.Sale } as Product }),
      );
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap({ id: 'p1' }));

      // Assert
      expect(component.isEdit).toBe(true);
      expect(component.id).toBe('p1');
      expect(component.data).toEqual({ id: 'p1', type: ProductType.Sale });
      expect(component.loading).toBe(false);
    });

    it('should redirect to not-found when the product does not exist', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getById.mockReturnValue(of({ data: null }));
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap({ id: 'missing' }));

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should redirect to not-found when the fetch fails', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getById.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap({ id: 'p1' }));

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
      expect(component.loading).toBe(false);
    });

    it('should stop reacting to route changes when ngOnDestroy was called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      paramMap$.next(paramMap({ id: 'p1' }));

      // Assert
      expect(productServiceMock.getById).not.toHaveBeenCalled();
    });
  });

  describe('getProductTypeLabel', () => {
    it('should return an empty string when there is no loaded product', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getProductTypeLabel()).toBe('');
    });

    it('should translate the loaded product type when data is present', () => {
      // Arrange
      const component = createComponent();
      component.data = { type: ProductType.Rental } as Product;

      // Act
      // Assert
      expect(component.getProductTypeLabel()).toBe('PRODUCTS.TYPE_RENTAL');
    });
  });
});
