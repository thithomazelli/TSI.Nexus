import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Order, WebApiResponse } from '@nexus/core';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };

  function createService(): OrderService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), getBlob: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(OrderService);
  }

  it('should create the service when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll, getById and getByBusinessPartnerId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('orders/getAll');

    service.getById('o1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('orders/getById/o1');

    service.getByBusinessPartnerId('bp1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('orders/getByBusinessPartnerId/bp1');
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<{ items: Order[] }>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service.getAllPaged({ page: 1, pageSize: 20 }).subscribe((v) => (result = v));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<{ items: Order[] }>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('orders/getAllPaged?page=1&pageSize=20');
    expect(result).toEqual({ items: [] });
  });

  it('should fetch a blob from the expected endpoint when getPdf is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.getBlob.mockReturnValue(new Subject());

    // Act
    service.getPdf('o1');

    // Assert
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith('orders/o1/Pdf');
  });

  it('should delegate to getAll when refreshOrders is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.refreshOrders();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('orders/getAll');
  });

  it('should emit once immediately to a new subscriber when orderChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.orderChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify orderChanged$ after each of add, update and delete completes', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Order>>();
    const updateResponse$ = new Subject<WebApiResponse<Order>>();
    const deleteResponse$ = new Subject<WebApiResponse<Order>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);

    let emissions = 0;
    service.orderChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act
    service.add({} as Order).subscribe();
    addResponse$.next({} as WebApiResponse<Order>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as Order).subscribe();
    updateResponse$.next({} as WebApiResponse<Order>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as Order).subscribe();
    deleteResponse$.next({} as WebApiResponse<Order>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(4);
  });
});
