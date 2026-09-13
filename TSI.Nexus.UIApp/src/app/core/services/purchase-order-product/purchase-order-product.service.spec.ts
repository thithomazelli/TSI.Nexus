import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, PurchaseOrderProduct, ResponseStatus, WebApiResponse } from '@nexus/core';
import { PurchaseOrderProductService } from './purchase-order-product.service';

describe('PurchaseOrderProductService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): PurchaseOrderProductService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(PurchaseOrderProductService);
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
    expect(apiServiceMock.get).toHaveBeenCalledWith('purchaseorderproducts/getAll');

    service.getByEntityId('po1', 'PurchaseOrder');
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      'purchaseorderproducts/getByPurchaseOrderId/po1',
    );
  });

  it('should emit once immediately to a new subscriber when purchaseOrderProductChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.purchaseOrderProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify purchaseOrderProductChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<PurchaseOrderProduct>>();
    const updateResponse$ = new Subject<WebApiResponse<PurchaseOrderProduct>>();
    const deleteResponse$ = new Subject<WebApiResponse<PurchaseOrderProduct>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.purchaseOrderProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as PurchaseOrderProduct).subscribe();
    addResponse$.next({} as WebApiResponse<PurchaseOrderProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as PurchaseOrderProduct).subscribe();
    updateResponse$.next({} as WebApiResponse<PurchaseOrderProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as PurchaseOrderProduct).subscribe();
    deleteResponse$.next({} as WebApiResponse<PurchaseOrderProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });

  describe('addTemporary', () => {
    it('should emit the item on purchaseOrderProductAdded$ and return a synthetic success response', () => {
      // Arrange
      const service = createService();
      const item = { id: 'pop1' } as PurchaseOrderProduct;
      let added: PurchaseOrderProduct | undefined;
      service.purchaseOrderProductAdded$.subscribe((v) => (added = v));

      // Act
      let response: WebApiResponse<PurchaseOrderProduct> | undefined;
      service.addTemporary(item).subscribe((v) => (response = v));

      // Assert
      expect(added).toBe(item);
      expect(response?.status).toBe(ResponseStatus.Success);
      expect(response?.data).toBe(item);
      expect(apiServiceMock.post).not.toHaveBeenCalled();
    });

    it('should not notify purchaseOrderProductChanged$ since it is not a persisted change', () => {
      // Arrange
      const service = createService();
      let emissions = 0;
      service.purchaseOrderProductChanged$.subscribe(() => emissions++);
      TestBed.flushEffects();
      expect(emissions).toBe(1);

      // Act
      service.addTemporary({} as PurchaseOrderProduct).subscribe();
      TestBed.flushEffects();

      // Assert
      expect(emissions).toBe(1);
    });
  });
});
