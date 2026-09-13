import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Commission } from '@nexus/core';
import { CommissionService } from './commission.service';

describe('CommissionService', () => {
  let apiServiceMock: { put: ReturnType<typeof vi.fn> };

  function createService(): CommissionService {
    apiServiceMock = { put: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(CommissionService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoint with the commission payload when update is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.put.mockReturnValue(new Subject());
    const commission = { id: 'c1' } as Commission;

    // Act
    service.update(commission);

    // Assert
    expect(apiServiceMock.put).toHaveBeenCalledWith('commissions/update', commission);
  });
});
