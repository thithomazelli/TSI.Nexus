import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, QuoteProduct, ResponseStatus, WebApiResponse } from '@nexus/core';
import { QuoteProductService } from './quote-product.service';

describe('QuoteProductService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): QuoteProductService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(QuoteProductService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll/getByEntityId/getById/getDelayed are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();
    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quoteproducts/getAll');

    // Act
    service.getByEntityId('q1', 'Quote');
    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quoteproducts/getByQuoteId/q1');

    // Act
    service.getById('qp1');
    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quoteproducts/getById/qp1');

    // Act
    service.getDelayed();
    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('quoteproducts/getDelayed');
  });

  it('should emit once immediately when a new subscriber subscribes to quoteProductChanged$', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.quoteProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify quoteProductChanged$ when add/update/delete each complete', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<QuoteProduct>>();
    const updateResponse$ = new Subject<WebApiResponse<QuoteProduct>>();
    const deleteResponse$ = new Subject<WebApiResponse<QuoteProduct>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);

    let emissions = 0;
    service.quoteProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act
    service.add({} as QuoteProduct).subscribe();
    addResponse$.next({} as WebApiResponse<QuoteProduct>);
    TestBed.flushEffects();
    // Assert
    expect(emissions).toBe(2);

    // Act
    service.update({} as QuoteProduct).subscribe();
    updateResponse$.next({} as WebApiResponse<QuoteProduct>);
    TestBed.flushEffects();
    // Assert
    expect(emissions).toBe(3);

    // Act
    service.delete({} as QuoteProduct).subscribe();
    deleteResponse$.next({} as WebApiResponse<QuoteProduct>);
    TestBed.flushEffects();
    // Assert
    expect(emissions).toBe(4);
  });

  describe('addTemporary', () => {
    it('should emit the item on quoteProductAdded$ and return a synthetic success response', () => {
      // Arrange
      const service = createService();
      const item = { id: 'qp1' } as QuoteProduct;
      let added: QuoteProduct | undefined;
      service.quoteProductAdded$.subscribe((v) => (added = v));

      let response: WebApiResponse<QuoteProduct> | undefined;

      // Act
      service.addTemporary(item).subscribe((v) => (response = v));

      // Assert
      expect(added).toBe(item);
      expect(response?.status).toBe(ResponseStatus.Success);
      expect(response?.data).toBe(item);
      expect(apiServiceMock.post).not.toHaveBeenCalled();
    });

    it('should not notify quoteProductChanged$ because it is not a persisted change', () => {
      // Arrange
      const service = createService();
      let emissions = 0;
      service.quoteProductChanged$.subscribe(() => emissions++);
      TestBed.flushEffects();
      expect(emissions).toBe(1);

      // Act
      service.addTemporary({} as QuoteProduct).subscribe();
      TestBed.flushEffects();

      // Assert
      expect(emissions).toBe(1);
    });
  });
});
