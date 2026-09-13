import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Quote, WebApiResponse } from '@nexus/core';
import { QuoteService } from './quote.service';

describe('QuoteService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };

  function createService(): QuoteService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), getBlob: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(QuoteService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should call the expected endpoints when getAll, getById, getByQuoteNumber, getByBusinessPartnerId and getByProductId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getAll');

    // Act
    service.getById('q1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getById/q1');

    // Act
    service.getByQuoteNumber('Q-001');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getByQuoteNumber/Q-001');

    // Act
    service.getByBusinessPartnerId('bp1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getByBusinessPartnerId/bp1');

    // Act
    service.getByProductId('p1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getByProductId/p1');
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<{ items: Quote[] }>>();
    apiServiceMock.get.mockReturnValue(paged$);

    let result: unknown;

    // Act
    service.getAllPaged({ page: 1, pageSize: 20 }).subscribe((v) => (result = v));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<{ items: Quote[] }>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getAllPaged?page=1&pageSize=20');
    expect(result).toEqual({ items: [] });
  });

  it('should fetch a blob from the expected endpoint when getPdf is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.getBlob.mockReturnValue(new Subject());

    // Act
    service.getPdf('q1');

    // Assert
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith('quotes/q1/Pdf');
  });

  it('should delegate to getAll when refreshQuotes is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.refreshQuotes();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quotes/getAll');
  });

  it('should emit once immediately when a new subscriber subscribes to quoteChanged$', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.quoteChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify quoteChanged$ when add, update, delete, convertToOrder or convertToTrip completes', () => {
    // Arrange
    const service = createService();
    const responses = Array.from({ length: 5 }, () => new Subject<WebApiResponse<Quote>>());
    apiServiceMock.post.mockReturnValueOnce(responses[0]).mockReturnValueOnce(responses[3]).mockReturnValueOnce(responses[4]);
    apiServiceMock.put.mockReturnValue(responses[1]);
    apiServiceMock.delete.mockReturnValue(responses[2]);

    let emissions = 0;
    service.quoteChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act
    service.add({} as Quote).subscribe();
    responses[0].next({} as WebApiResponse<Quote>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(2);

    // Act
    service.update({} as Quote).subscribe();
    responses[1].next({} as WebApiResponse<Quote>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(3);

    // Act
    service.delete({} as Quote).subscribe();
    responses[2].next({} as WebApiResponse<Quote>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(4);

    // Act
    service.convertToOrder({} as Quote).subscribe();
    responses[3].next({} as WebApiResponse<Quote>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(5);

    // Act
    service.convertToTrip({} as Quote).subscribe();
    responses[4].next({} as WebApiResponse<Quote>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(6);
  });
});
