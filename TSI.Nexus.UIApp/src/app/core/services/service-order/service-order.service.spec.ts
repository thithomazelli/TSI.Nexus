import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService } from '@nexus/core';
import { ServiceOrderService } from './service-order.service';

describe('ServiceOrderService', () => {
  let apiServiceMock: { get: ReturnType<typeof vi.fn> };

  function createService(): ServiceOrderService {
    apiServiceMock = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(ServiceOrderService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoint when getByDriver is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByDriver('d1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('serviceorders/getByDriver/d1');
  });
});
