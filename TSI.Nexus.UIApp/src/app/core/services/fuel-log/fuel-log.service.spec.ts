import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, FuelLog, WebApiResponse } from '@nexus/core';
import { FuelLogService } from './fuel-log.service';

describe('FuelLogService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): FuelLogService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(FuelLogService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll and getByVehicle are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('fuellogs/getAll');

    service.getByVehicle('v1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('fuellogs/getByVehicle/v1');
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<{ items: FuelLog[] }>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service.getAllPaged({ page: 1, pageSize: 20 }).subscribe((v) => (result = v));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<{ items: FuelLog[] }>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('fuellogs/getAllPaged?page=1&pageSize=20');
    expect(result).toEqual({ items: [] });
  });

  it('should emit once immediately to a new subscriber when fuelLogChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.fuelLogChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify fuelLogChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<FuelLog>>();
    const updateResponse$ = new Subject<WebApiResponse<FuelLog>>();
    const deleteResponse$ = new Subject<WebApiResponse<FuelLog>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.fuelLogChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as FuelLog).subscribe();
    addResponse$.next({} as WebApiResponse<FuelLog>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as FuelLog).subscribe();
    updateResponse$.next({} as WebApiResponse<FuelLog>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as FuelLog).subscribe();
    deleteResponse$.next({} as WebApiResponse<FuelLog>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });
});
