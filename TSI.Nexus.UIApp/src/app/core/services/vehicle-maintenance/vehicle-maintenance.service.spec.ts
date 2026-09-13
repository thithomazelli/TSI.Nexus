import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, VehicleMaintenance, WebApiResponse } from '@nexus/core';
import { VehicleMaintenanceService } from './vehicle-maintenance.service';

describe('VehicleMaintenanceService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): VehicleMaintenanceService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(VehicleMaintenanceService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll/getById/getByVehicle are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('vehiclemaintenances/getAll');

    service.getById('vm1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('vehiclemaintenances/getById/vm1');

    service.getByVehicle('v1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('vehiclemaintenances/getByVehicle/v1');
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<{ items: VehicleMaintenance[] }>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service.getAllPaged({ page: 2, pageSize: 10 }).subscribe((v) => (result = v));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<{ items: VehicleMaintenance[] }>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('vehiclemaintenances/getAllPaged?page=2&pageSize=10');
    expect(result).toEqual({ items: [] });
  });

  it('should emit once immediately to a new subscriber when maintenanceChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.maintenanceChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify maintenanceChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<VehicleMaintenance>>();
    const updateResponse$ = new Subject<WebApiResponse<VehicleMaintenance>>();
    const deleteResponse$ = new Subject<WebApiResponse<VehicleMaintenance>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.maintenanceChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as VehicleMaintenance).subscribe();
    addResponse$.next({} as WebApiResponse<VehicleMaintenance>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as VehicleMaintenance).subscribe();
    updateResponse$.next({} as WebApiResponse<VehicleMaintenance>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as VehicleMaintenance).subscribe();
    deleteResponse$.next({} as WebApiResponse<VehicleMaintenance>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });
});
