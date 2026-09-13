import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, WebApiResponse } from '@nexus/core';
import { VehicleMaintenanceProduct } from '../../models';
import { VehicleMaintenanceProductService } from './vehicle-maintenance-product.service';

describe('VehicleMaintenanceProductService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): VehicleMaintenanceProductService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(VehicleMaintenanceProductService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoint when getByEntityId is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByEntityId('vm1', 'VehicleMaintenance');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      'vehiclemaintenanceproducts/getByVehicleMaintenanceId/vm1',
    );
  });

  it('should emit once immediately to a new subscriber when vehicleMaintenanceProductChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.vehicleMaintenanceProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify vehicleMaintenanceProductChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<VehicleMaintenanceProduct>>();
    const updateResponse$ = new Subject<WebApiResponse<VehicleMaintenanceProduct>>();
    const deleteResponse$ = new Subject<WebApiResponse<VehicleMaintenanceProduct>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.vehicleMaintenanceProductChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as VehicleMaintenanceProduct).subscribe();
    addResponse$.next({} as WebApiResponse<VehicleMaintenanceProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as VehicleMaintenanceProduct).subscribe();
    updateResponse$.next({} as WebApiResponse<VehicleMaintenanceProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as VehicleMaintenanceProduct).subscribe();
    deleteResponse$.next({} as WebApiResponse<VehicleMaintenanceProduct>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });
});
