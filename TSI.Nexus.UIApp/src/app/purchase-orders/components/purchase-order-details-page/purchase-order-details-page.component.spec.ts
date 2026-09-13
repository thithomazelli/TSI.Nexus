import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  PaymentService,
  PurchaseOrder,
  PurchaseOrderProductService,
  PurchaseOrderService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { PurchaseOrderDetailsPageComponent } from './purchase-order-details-page.component';

describe('PurchaseOrderDetailsPageComponent', () => {
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let purchaseOrderServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    purchaseOrderChanged$: Subject<void>;
  };
  let purchaseOrderProductServiceMock: { purchaseOrderProductChanged$: Subject<void> };
  let paymentServiceMock: { paymentChanged$: Subject<void> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };

  function createComponent(id: string | null): PurchaseOrderDetailsPageComponent {
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(id) } } };
    purchaseOrderServiceMock = {
      getById: vi.fn().mockReturnValue(new Subject()),
      purchaseOrderChanged$: new Subject(),
    };
    purchaseOrderProductServiceMock = { purchaseOrderProductChanged$: new Subject() };
    paymentServiceMock = { paymentChanged$: new Subject() };
    routerMock = { navigateByUrl: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new PurchaseOrderDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          purchaseOrderServiceMock as unknown as PurchaseOrderService,
          purchaseOrderProductServiceMock as unknown as PurchaseOrderProductService,
          paymentServiceMock as unknown as PaymentService,
          routerMock as unknown as Router,
          featureFlagServiceMock as unknown as FeatureFlagService,
        ),
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent(null)).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    // Assert
    expect(component.isAgendaEnabled()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false when there is no route id (new purchase order)', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing purchase order when a real id is provided', () => {
      // Arrange
      const component = createComponent('po1');
      const response$ = new Subject<WebApiResponse<PurchaseOrder>>();
      purchaseOrderServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(true);
      expect(purchaseOrderServiceMock.getById).toHaveBeenCalledWith('po1');

      const data = { id: 'po1' } as PurchaseOrder;
      response$.next({ data } as WebApiResponse<PurchaseOrder>);

      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
    });

    it('should navigate to not-found when the purchase order does not exist', () => {
      // Arrange
      const component = createComponent('missing');
      const response$ = new Subject<WebApiResponse<PurchaseOrder>>();
      purchaseOrderServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      response$.next({ data: null } as unknown as WebApiResponse<PurchaseOrder>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const component = createComponent('po1');
      const response$ = new Subject<WebApiResponse<PurchaseOrder>>();
      purchaseOrderServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should re-fetch on a real purchaseOrderProductChanged$ event but not on the skip(1)-dropped first one', () => {
      // Arrange
      const component = createComponent('po1');
      const firstResponse$ = new Subject<WebApiResponse<PurchaseOrder>>();
      const secondResponse$ = new Subject<WebApiResponse<PurchaseOrder>>();
      purchaseOrderServiceMock.getById
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);
      component.ngOnInit();
      firstResponse$.next({ data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>);
      expect(purchaseOrderServiceMock.getById).toHaveBeenCalledTimes(1);

      // Act
      purchaseOrderProductServiceMock.purchaseOrderProductChanged$.next();
      expect(purchaseOrderServiceMock.getById).toHaveBeenCalledTimes(1);

      purchaseOrderProductServiceMock.purchaseOrderProductChanged$.next();

      // Assert
      expect(purchaseOrderServiceMock.getById).toHaveBeenCalledTimes(2);

      secondResponse$.next({ data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>);
      expect(component.data).toEqual({ id: 'po1' });
    });
  });

  describe('getStatusLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should return an empty string when data has no status', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'po1', status: null } as unknown as PurchaseOrder;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should resolve the mapped status label when the status is known', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'po1', status: 'Open' } as unknown as PurchaseOrder;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('Em aberto');
    });

    it('should fall back to an empty string when the status has no mapped label', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'po1', status: 'Unknown' } as unknown as PurchaseOrder;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent(null);
    component.ngOnInit();

    // Act
    // Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should unsubscribe from purchaseOrderChanged$/purchaseOrderProductChanged$/paymentChanged$ when editing and ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent('po1');
    purchaseOrderServiceMock.getById.mockReturnValue(new Subject());
    component.ngOnInit();

    // Act
    component.ngOnDestroy();
    purchaseOrderServiceMock.getById.mockClear();
    purchaseOrderServiceMock.purchaseOrderChanged$.next();
    purchaseOrderServiceMock.purchaseOrderChanged$.next();

    // Assert
    expect(purchaseOrderServiceMock.getById).not.toHaveBeenCalled();
  });
});
