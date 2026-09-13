import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Passenger, WebApiResponse } from '@nexus/core';
import { PassengerService } from './passenger.service';

describe('PassengerService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): PassengerService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(PassengerService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the getByTrip endpoint when getByTrip is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByTrip('t1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('passengers/getByTrip/t1');
  });

  it('should emit once immediately when a new subscriber subscribes to passengerChanged$', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.passengerChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify passengerChanged$ when add/addRange/update/delete each complete their request', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Passenger>>();
    const addRangeResponse$ = new Subject<WebApiResponse<Passenger[]>>();
    const updateResponse$ = new Subject<WebApiResponse<Passenger>>();
    const deleteResponse$ = new Subject<WebApiResponse<Passenger>>();
    apiServiceMock.post.mockReturnValueOnce(addResponse$).mockReturnValueOnce(addRangeResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);

    // Act
    let emissions = 0;
    service.passengerChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);

    // Act
    service.add({} as Passenger).subscribe();
    addResponse$.next({} as WebApiResponse<Passenger>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(2);

    // Act
    service.addRange([{} as Passenger]).subscribe();

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith('passengers/addRange', [{}]);

    // Act
    addRangeResponse$.next({} as WebApiResponse<Passenger[]>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(3);

    // Act
    service.update({} as Passenger).subscribe();
    updateResponse$.next({} as WebApiResponse<Passenger>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(4);

    // Act
    service.delete({} as Passenger).subscribe();
    deleteResponse$.next({} as WebApiResponse<Passenger>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(5);
  });
});
