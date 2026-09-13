import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, TripLeg, WebApiResponse } from '@nexus/core';
import { TripLegService } from './trip-leg.service';

describe('TripLegService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): TripLegService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(TripLegService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoint when getByTrip is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByTrip('t1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('triplegs/getByTrip/t1');
  });

  it('should emit once immediately to a new subscriber when tripLegChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.tripLegChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify tripLegChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<TripLeg>>();
    const updateResponse$ = new Subject<WebApiResponse<TripLeg>>();
    const deleteResponse$ = new Subject<WebApiResponse<TripLeg>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.tripLegChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as TripLeg).subscribe();
    addResponse$.next({} as WebApiResponse<TripLeg>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as TripLeg).subscribe();
    updateResponse$.next({} as WebApiResponse<TripLeg>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as TripLeg).subscribe();
    deleteResponse$.next({} as WebApiResponse<TripLeg>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });

  it('should post to the expected endpoints with the given payload when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());
    apiServiceMock.put.mockReturnValue(new Subject());
    apiServiceMock.delete.mockReturnValue(new Subject());
    const tripLeg = { id: 'tl1' } as TripLeg;

    // Act
    service.add(tripLeg).subscribe();

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith('triplegs/add', tripLeg);

    service.update(tripLeg).subscribe();
    expect(apiServiceMock.put).toHaveBeenCalledWith('triplegs/update', tripLeg);

    service.delete(tripLeg).subscribe();
    expect(apiServiceMock.delete).toHaveBeenCalledWith('triplegs/remove', tripLeg);
  });
});
