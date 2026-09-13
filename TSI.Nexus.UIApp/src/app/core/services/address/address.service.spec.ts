import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Address, ApiService, WebApiResponse } from '@nexus/core';
import { AddressService } from './address.service';

describe('AddressService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): AddressService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(AddressService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should call the getAllByBusinessPartnerId endpoint when getAllByBusinessPartnerId is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAllByBusinessPartnerId('bp1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('addresses/getAllByBusinessPartnerId/bp1');
  });

  it('should delegate to getAllByBusinessPartnerId when refresh is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.refresh('bp1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('addresses/getAllByBusinessPartnerId/bp1');
  });

  it('should emit once immediately when a new subscriber subscribes to addressChanged$', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.addressChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify addressChanged$ when add, update or delete completes', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Address>>();
    const updateResponse$ = new Subject<WebApiResponse<Address>>();
    const deleteResponse$ = new Subject<WebApiResponse<Address>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);

    let emissions = 0;
    service.addressChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act
    service.add({} as Address).subscribe();
    addResponse$.next({} as WebApiResponse<Address>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(2);

    // Act
    service.update({} as Address).subscribe();
    updateResponse$.next({} as WebApiResponse<Address>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(3);

    // Act
    service.delete({} as Address).subscribe();
    deleteResponse$.next({} as WebApiResponse<Address>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(4);
  });
});
