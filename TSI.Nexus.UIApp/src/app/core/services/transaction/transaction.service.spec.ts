import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Transaction, WebApiResponse } from '@nexus/core';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): TransactionService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(TransactionService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll/getById/getByBusinessPartnerId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('transactions/getAll');

    service.getById('t1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('transactions/getById/t1');

    service.getByBusinessPartnerId('bp1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('transactions/getByBusinessPartnerId/bp1');
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<{ items: Transaction[] }>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service.getAllPaged({ page: 1, pageSize: 20 }).subscribe((v) => (result = v));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<{ items: Transaction[] }>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('transactions/getAllPaged?page=1&pageSize=20');
    expect(result).toEqual({ items: [] });
  });

  it('should delegate to getAll when refreshTransactions is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.refreshTransactions();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('transactions/getAll');
  });

  it('should emit once immediately to a new subscriber when transactionChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.transactionChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify transactionChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Transaction>>();
    const updateResponse$ = new Subject<WebApiResponse<Transaction>>();
    const deleteResponse$ = new Subject<WebApiResponse<Transaction>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.transactionChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as Transaction).subscribe();
    addResponse$.next({} as WebApiResponse<Transaction>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as Transaction).subscribe();
    updateResponse$.next({} as WebApiResponse<Transaction>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as Transaction).subscribe();
    deleteResponse$.next({} as WebApiResponse<Transaction>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });
});
