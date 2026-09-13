import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, PagedResult, Product, WebApiResponse } from '@nexus/core';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): ProductService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(new Subject());
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(ProductService);
  }

  it('should create the service when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  it('should trigger a getAll fetch eagerly when the service is constructed', () => {
    // Act
    createService();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('products/getAll');
  });

  it('should not emit on products$ before the initial load resolves', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.getAll().subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(0);
  });

  it('should emit the loaded response on products$ once the request resolves', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<Product[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(ProductService);
    let response: WebApiResponse<Product[]> | undefined;
    service.getAll().subscribe((v) => (response = v));
    TestBed.flushEffects();
    expect(response).toBeUndefined();

    // Act
    const loaded = { data: [{ id: 'p1' } as Product] } as WebApiResponse<Product[]>;
    load$.next(loaded);
    TestBed.flushEffects();

    // Assert
    expect(response).toBe(loaded);
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<PagedResult<Product>>>();
    apiServiceMock.get.mockReturnValue(paged$);
    let result: PagedResult<Product> | undefined;

    // Act
    service.getAllPaged({ page: 1, pageSize: 10 } as never).subscribe((v) => (result = v));

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      expect.stringContaining('products/getAllPaged?'),
    );

    const pagedResult = { items: [{ id: 'p1' } as Product], totalCount: 1 } as PagedResult<Product>;
    paged$.next({ data: pagedResult } as WebApiResponse<PagedResult<Product>>);

    expect(result).toBe(pagedResult);
  });

  it('should hit the expected endpoint when getById is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getById('p1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('products/getById/p1');
  });

  it('should re-fetch and reflect the updated value on products$ when refresh is called', () => {
    // Arrange
    const service = createService();
    const second$ = new Subject<WebApiResponse<Product[]>>();
    apiServiceMock.get.mockReturnValue(second$);
    let response: WebApiResponse<Product[]> | undefined;
    service.getAll().subscribe((v) => (response = v));

    // Act
    service.refresh();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);

    const refreshed = { data: [{ id: 'p2' } as Product] } as WebApiResponse<Product[]>;
    second$.next(refreshed);
    TestBed.flushEffects();

    expect(response).toBe(refreshed);
  });

  it('should trigger a refresh and notify productChanged$ when add, update or delete is called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Product>>();
    const updateResponse$ = new Subject<WebApiResponse<Product>>();
    const deleteResponse$ = new Subject<WebApiResponse<Product>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    apiServiceMock.get.mockReturnValue(new Subject());
    let changedEmissions = 0;
    service.productChanged$.subscribe(() => changedEmissions++);
    TestBed.flushEffects();
    expect(changedEmissions).toBe(1);
    const getCallsBefore = apiServiceMock.get.mock.calls.length;

    // Act
    service.add({} as Product).subscribe();
    addResponse$.next({} as WebApiResponse<Product>);
    TestBed.flushEffects();

    // Assert
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 1);
    expect(changedEmissions).toBe(2);

    service.update({} as Product).subscribe();
    updateResponse$.next({} as WebApiResponse<Product>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 2);
    expect(changedEmissions).toBe(3);

    service.delete({} as Product).subscribe();
    deleteResponse$.next({} as WebApiResponse<Product>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 3);
    expect(changedEmissions).toBe(4);
  });
});
