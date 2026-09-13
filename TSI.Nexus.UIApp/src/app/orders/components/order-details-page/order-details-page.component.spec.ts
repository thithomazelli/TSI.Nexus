import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  ModalService,
  Order,
  OrderProductService,
  OrderService,
  PaymentService,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { OrderDetailsPageComponent } from './order-details-page.component';

describe('OrderDetailsPageComponent', () => {
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let orderServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    getPdf: ReturnType<typeof vi.fn>;
    orderChanged$: Subject<void>;
  };
  let orderProductServiceMock: { orderProductChanged$: Subject<void> };
  let paymentServiceMock: { paymentChanged$: Subject<void> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showPdfProgress: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let progressHandle: { setIndeterminate: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function createComponent(id: string | null): OrderDetailsPageComponent {
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(id) } } };
    orderServiceMock = {
      getById: vi.fn().mockReturnValue(new Subject()),
      getPdf: vi.fn(),
      orderChanged$: new Subject(),
    };
    orderProductServiceMock = { orderProductChanged$: new Subject() };
    paymentServiceMock = { paymentChanged$: new Subject() };
    routerMock = { navigateByUrl: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    progressHandle = { setIndeterminate: vi.fn(), success: vi.fn(), error: vi.fn() };
    modalServiceMock = { showPdfProgress: vi.fn().mockReturnValue(progressHandle) };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new OrderDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          orderServiceMock as unknown as OrderService,
          orderProductServiceMock as unknown as OrderProductService,
          paymentServiceMock as unknown as PaymentService,
          routerMock as unknown as Router,
          featureFlagServiceMock as unknown as FeatureFlagService,
          modalServiceMock as unknown as ModalService,
          translationServiceMock as unknown as TranslationService,
        ),
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    const result = component.isAgendaEnabled();

    // Assert
    expect(result).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false for a new order', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing order by id', () => {
      // Arrange
      const component = createComponent('o1');
      const response$ = new Subject<WebApiResponse<Order>>();
      orderServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(true);
      expect(orderServiceMock.getById).toHaveBeenCalledWith('o1');

      // Act
      const data = { id: 'o1' } as Order;
      response$.next({ data } as WebApiResponse<Order>);

      // Assert
      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
    });

    it('should navigate to not-found when the order does not exist', () => {
      // Arrange
      const component = createComponent('missing');
      const response$ = new Subject<WebApiResponse<Order>>();
      orderServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.next({ data: null } as unknown as WebApiResponse<Order>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const component = createComponent('o1');
      const response$ = new Subject<WebApiResponse<Order>>();
      orderServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should re-fetch on a real orderProductChanged$ event but not on the skip(1)-dropped first one', () => {
      // Arrange
      const component = createComponent('o1');
      const firstResponse$ = new Subject<WebApiResponse<Order>>();
      const secondResponse$ = new Subject<WebApiResponse<Order>>();
      orderServiceMock.getById
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);

      // Act
      component.ngOnInit();
      firstResponse$.next({ data: { id: 'o1' } } as WebApiResponse<Order>);

      // Assert
      expect(orderServiceMock.getById).toHaveBeenCalledTimes(1);

      // Act
      // skip(1) is per-source (mirrors a BehaviorSubject's replay-on-subscribe), so the first
      // .next() on any one of the three merged sources is dropped - this one alone must not
      // trigger a re-fetch.
      orderProductServiceMock.orderProductChanged$.next();

      // Assert
      expect(orderServiceMock.getById).toHaveBeenCalledTimes(1);

      // Act
      // A second, real change on that same source does trigger a re-fetch.
      orderProductServiceMock.orderProductChanged$.next();

      // Assert
      expect(orderServiceMock.getById).toHaveBeenCalledTimes(2);

      // Act
      secondResponse$.next({ data: { id: 'o1' } } as WebApiResponse<Order>);

      // Assert
      expect(component.data).toEqual({ id: 'o1' });
    });
  });

  describe('getStatusLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      const result = component.getStatusLabel();

      // Assert
      expect(result).toBe('');
    });

    it('should return an empty string when data has no status', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'o1', status: null } as unknown as Order;

      // Act
      const result = component.getStatusLabel();

      // Assert
      expect(result).toBe('');
    });

    it('should resolve the mapped status label when data has a known status', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'o1', status: 'Open' } as unknown as Order;

      // Act
      const result = component.getStatusLabel();

      // Assert
      expect(result).toBe('Em aberto');
    });

    it('should fall back to an empty string when the status has no mapped label', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'o1', status: 'Unknown' } as unknown as Order;

      // Act
      const result = component.getStatusLabel();

      // Assert
      expect(result).toBe('');
    });
  });

  describe('emitSalesOrder', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.emitSalesOrder();

      // Assert
      expect(modalServiceMock.showPdfProgress).not.toHaveBeenCalled();
    });

    it('should show progress and report success when the PDF resolves', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'o1', orderNumber: '123' } as Order;
      const blob = new Blob(['x']);
      orderServiceMock.getPdf.mockReturnValue(of(blob));

      // Act
      component.emitSalesOrder();

      // Assert
      expect(progressHandle.setIndeterminate).toHaveBeenCalled();
      expect(progressHandle.success).toHaveBeenCalled();
      expect(component.emittingSalesOrder).toBe(false);
    });

    it('should report an error when PDF generation fails', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'o1', orderNumber: '123' } as Order;
      const error$ = new Subject<Blob>();
      orderServiceMock.getPdf.mockReturnValue(error$);

      // Act
      component.emitSalesOrder();
      error$.error(new Error('boom'));

      // Assert
      expect(progressHandle.error).toHaveBeenCalled();
      expect(component.emittingSalesOrder).toBe(false);
    });

    it('should do nothing while a previous emission is still in flight', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'o1', orderNumber: '123' } as Order;
      component.emittingSalesOrder = true;

      // Act
      component.emitSalesOrder();

      // Assert
      expect(modalServiceMock.showPdfProgress).not.toHaveBeenCalled();
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent(null);
    component.ngOnInit();

    // Act
    const act = () => component.ngOnDestroy();

    // Assert
    expect(act).not.toThrow();
  });

  it('should also unsubscribe from orderChanged$/orderProductChanged$/paymentChanged$ when editing an existing order', () => {
    // Arrange
    const component = createComponent('o1');
    orderServiceMock.getById.mockReturnValue(new Subject());
    component.ngOnInit();

    // Act
    component.ngOnDestroy();
    orderServiceMock.getById.mockClear();
    orderServiceMock.orderChanged$.next();
    orderServiceMock.orderChanged$.next();

    // Assert
    expect(orderServiceMock.getById).not.toHaveBeenCalled();
  });
});
