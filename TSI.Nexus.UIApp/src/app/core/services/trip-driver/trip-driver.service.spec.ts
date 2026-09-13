import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, ResponseStatus, TripDriver, WebApiResponse } from '@nexus/core';
import { TripDriverService } from './trip-driver.service';

describe('TripDriverService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): TripDriverService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(TripDriverService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getByTripId and getByDriverId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByTripId('t1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('tripdrivers/getByTripId/t1');

    // Act
    service.getByDriverId('d1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('tripdrivers/getByDriverId/d1');
  });

  it('should emit once immediately when a new subscriber subscribes to tripDriverChanged$', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.tripDriverChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify tripDriverChanged$ when add, update, or delete requests complete', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<TripDriver>>();
    const updateResponse$ = new Subject<WebApiResponse<TripDriver>>();
    const deleteResponse$ = new Subject<WebApiResponse<TripDriver>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);

    let emissions = 0;
    service.tripDriverChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act
    service.add({} as TripDriver).subscribe();
    addResponse$.next({} as WebApiResponse<TripDriver>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(2);

    // Act
    service.update({} as TripDriver).subscribe();
    updateResponse$.next({} as WebApiResponse<TripDriver>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(3);

    // Act
    service.delete({} as TripDriver).subscribe();
    deleteResponse$.next({} as WebApiResponse<TripDriver>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(4);
  });

  describe('addTemporary', () => {
    it('should emit the item on tripDriverAdded$ and return a synthetic success response when called', () => {
      // Arrange
      const service = createService();
      const item = { id: 'td1' } as TripDriver;
      let added: TripDriver | undefined;
      service.tripDriverAdded$.subscribe((v) => (added = v));

      let response: WebApiResponse<TripDriver> | undefined;

      // Act
      service.addTemporary(item).subscribe((v) => (response = v));

      // Assert
      expect(added).toBe(item);
      expect(response?.status).toBe(ResponseStatus.Success);
      expect(response?.data).toBe(item);
      expect(apiServiceMock.post).not.toHaveBeenCalled();
    });

    it('should not notify tripDriverChanged$ when addTemporary is called, since it is not a persisted change', () => {
      // Arrange
      const service = createService();
      let emissions = 0;
      service.tripDriverChanged$.subscribe(() => emissions++);
      TestBed.flushEffects();
      expect(emissions).toBe(1);

      // Act
      service.addTemporary({} as TripDriver).subscribe();
      TestBed.flushEffects();

      // Assert
      expect(emissions).toBe(1);
    });
  });
});
