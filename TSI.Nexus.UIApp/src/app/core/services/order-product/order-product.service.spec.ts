import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, OrderProduct, ResponseStatus, WebApiResponse } from '@nexus/core';
import { OrderProductService } from './order-product.service';

describe('OrderProductService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): OrderProductService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(OrderProductService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll/getByEntityId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('orderproducts/getAll');

    service.getByEntityId('o1', 'Order');
    expect(apiServiceMock.get).toHaveBeenCalledWith('orderproducts/getByOrderId/o1');
  });

  it('should emit once immediately to a new subscriber when orderProductChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.orderProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify orderProductChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<OrderProduct>>();
    const updateResponse$ = new Subject<WebApiResponse<OrderProduct>>();
    const deleteResponse$ = new Subject<WebApiResponse<OrderProduct>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.orderProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as OrderProduct).subscribe();
    addResponse$.next({} as WebApiResponse<OrderProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as OrderProduct).subscribe();
    updateResponse$.next({} as WebApiResponse<OrderProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as OrderProduct).subscribe();
    deleteResponse$.next({} as WebApiResponse<OrderProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });

  describe('addTemporary', () => {
    it('should emit the item on orderProductAdded$ and return a synthetic success response', () => {
      // Arrange
      const service = createService();
      const orderProduct = { id: 'op1' } as OrderProduct;
      let added: OrderProduct | undefined;
      service.orderProductAdded$.subscribe((v) => (added = v));

      // Act
      let response: WebApiResponse<OrderProduct> | undefined;
      service.addTemporary(orderProduct).subscribe((v) => (response = v));

      // Assert
      expect(added).toBe(orderProduct);
      expect(response?.status).toBe(ResponseStatus.Success);
      expect(response?.data).toBe(orderProduct);
      expect(apiServiceMock.post).not.toHaveBeenCalled();
    });

    it('should not notify orderProductChanged$ because it is not a persisted change', () => {
      // Arrange
      const service = createService();
      let emissions = 0;
      service.orderProductChanged$.subscribe(() => emissions++);
      TestBed.flushEffects();
      expect(emissions).toBe(1);

      // Act
      service.addTemporary({} as OrderProduct).subscribe();
      TestBed.flushEffects();

      // Assert
      expect(emissions).toBe(1);
    });
  });
});
