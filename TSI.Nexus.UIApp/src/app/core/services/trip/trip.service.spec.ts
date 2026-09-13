import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Trip, TripLeg, WebApiResponse } from '@nexus/core';
import { TripService } from './trip.service';

describe('TripService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };

  function createService(): TripService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), getBlob: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(TripService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll/getById/getByBusinessPartnerId/getByDriverId/getByVehicleId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getAll');

    service.getById('t1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getById/t1');

    service.getByBusinessPartnerId('bp1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getByBusinessPartnerId/bp1');

    service.getByDriverId('d1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getByDriverId/d1');

    service.getByVehicleId('v1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getByVehicleId/v1');
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<{ items: Trip[] }>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service.getAllPaged({ page: 1, pageSize: 20 }).subscribe((v) => (result = v));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<{ items: Trip[] }>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getAllPaged?page=1&pageSize=20');
    expect(result).toEqual({ items: [] });
  });

  it('should fetch a blob from the expected endpoints when getContractPdf and getServiceOrderPdf are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.getBlob.mockReturnValue(new Subject());

    // Act
    service.getContractPdf('t1');

    // Assert
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith('trips/t1/ContractPdf');

    service.getServiceOrderPdf('t1');
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith('trips/t1/ServiceOrderPdf');
  });

  it('should delegate to getAll when refreshTrips is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.refreshTrips();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('trips/getAll');
  });

  it('should emit once immediately to a new subscriber when tripChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.tripChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify tripChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Trip>>();
    const updateResponse$ = new Subject<WebApiResponse<Trip>>();
    const deleteResponse$ = new Subject<WebApiResponse<Trip>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.tripChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);

    // Act / Assert
    service.add({} as Trip).subscribe();
    addResponse$.next({} as WebApiResponse<Trip>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as Trip).subscribe();
    updateResponse$.next({} as WebApiResponse<Trip>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as Trip).subscribe();
    deleteResponse$.next({} as WebApiResponse<Trip>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });

  describe('buildAgendaEvent', () => {
    function leg(overrides: Partial<TripLeg> = {}): TripLeg {
      return {
        sequenceNumber: 1,
        departureDate: new Date('2024-01-01T08:00:00'),
        arrivalDate: new Date('2024-01-01T10:00:00'),
        ...overrides,
      } as TripLeg;
    }

    it('should span from the first departure to the last arrival, by sequence', () => {
      // Arrange
      const service = createService();
      const trip = { id: 't1', tripNumber: 'T-001', route: 'SP-RJ' } as Trip;
      const legs = [
        leg({
          sequenceNumber: 2,
          departureDate: new Date('2024-01-02T08:00:00'),
          arrivalDate: new Date('2024-01-02T12:00:00'),
        }),
        leg({
          sequenceNumber: 1,
          departureDate: new Date('2024-01-01T08:00:00'),
          arrivalDate: new Date('2024-01-01T10:00:00'),
        }),
      ];

      // Act
      const event = service.buildAgendaEvent(trip, legs);

      // Assert
      expect(event.startDate).toEqual(new Date('2024-01-01T08:00:00'));
      expect(event.endDate).toEqual(new Date('2024-01-02T12:00:00'));
      expect(event.title).toBe('T-001 - SP-RJ');
      expect(event.tripId).toBe('t1');
      expect(event.readOnly).toBe(true);
    });

    it('should fall back to the trip date when there are no legs with valid dates', () => {
      // Arrange
      const service = createService();
      const trip = { id: 't1', tripNumber: 'T-001', date: new Date('2024-05-01T00:00:00') } as unknown as Trip;

      // Act
      const event = service.buildAgendaEvent(trip, []);

      // Assert
      expect(event.startDate).toEqual(new Date('2024-05-01T00:00:00'));
      expect(event.endDate).toEqual(new Date('2024-05-01T00:00:00'));
      expect(event.title).toBe('T-001');
    });

    it('should use departureDate as the arrival fallback when arrivalDate is missing', () => {
      // Arrange
      const service = createService();
      const trip = { id: 't1', tripNumber: 'T-001' } as Trip;
      const legs = [leg({ arrivalDate: undefined as unknown as Date })];

      // Act
      const event = service.buildAgendaEvent(trip, legs);

      // Assert
      expect(event.endDate).toEqual(event.startDate);
    });

    it('should clamp endDate to startDate when the computed arrival is earlier than the departure', () => {
      // Arrange
      const service = createService();
      const trip = { id: 't1', tripNumber: 'T-001' } as Trip;
      const legs = [
        leg({
          departureDate: new Date('2024-01-05T08:00:00'),
          arrivalDate: new Date('2024-01-01T10:00:00'),
        }),
      ];

      // Act
      const event = service.buildAgendaEvent(trip, legs);

      // Assert
      expect(event.startDate).toEqual(new Date('2024-01-05T08:00:00'));
      expect(event.endDate).toEqual(new Date('2024-01-05T08:00:00'));
    });
  });
});
