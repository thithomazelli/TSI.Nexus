import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  TranslationService,
  Trip,
  TripLegService,
  TripService,
  Vehicle,
  VehicleMaintenanceService,
  VehicleService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { VehicleDetailsPageComponent } from './vehicle-details-page.component';

describe('VehicleDetailsPageComponent', () => {
  let paramMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { paramMap: Subject<{ get: (key: string) => string | null }> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let vehicleServiceMock: { getById: ReturnType<typeof vi.fn>; vehicleChanged$: Subject<void> };
  let vehicleMaintenanceServiceMock: { maintenanceChanged$: Subject<void> };
  let tripServiceMock: { getByVehicleId: ReturnType<typeof vi.fn>; buildAgendaEvent: ReturnType<typeof vi.fn> };
  let tripLegServiceMock: { getByTrip: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };

  function createComponent(): VehicleDetailsPageComponent {
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    vehicleServiceMock = { getById: vi.fn().mockReturnValue(new Subject()), vehicleChanged$: new Subject() };
    vehicleMaintenanceServiceMock = { maintenanceChanged$: new Subject() };
    tripServiceMock = {
      getByVehicleId: vi.fn().mockReturnValue(of({ data: [] } as unknown as WebApiResponse<Trip[]>)),
      buildAgendaEvent: vi.fn(),
    };
    tripLegServiceMock = { getByTrip: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new VehicleDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          translationServiceMock as unknown as TranslationService,
          vehicleServiceMock as unknown as VehicleService,
          vehicleMaintenanceServiceMock as unknown as VehicleMaintenanceService,
          tripServiceMock as unknown as TripService,
          tripLegServiceMock as unknown as TripLegService,
          routerMock as unknown as Router,
          featureFlagServiceMock as unknown as FeatureFlagService,
        ),
    );
  }

  function paramMap(id: string | null) {
    return { get: (key: string) => (key === 'id' ? id : null) };
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(component.isAgendaEnabled()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false when the route param is "new"', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('new'));

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing vehicle by id and its trip agenda events', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Vehicle>>();
      vehicleServiceMock.getById.mockReturnValue(response$);
      const trip = { id: 'trip1' } as Trip;
      tripServiceMock.getByVehicleId.mockReturnValue(of({ data: [trip] } as WebApiResponse<Trip[]>));
      tripLegServiceMock.getByTrip.mockReturnValue(of({ data: [] }));
      tripServiceMock.buildAgendaEvent.mockReturnValue({ id: 'agenda1' });

      // Act
      component.ngOnInit();
      paramMap$.next(paramMap('v1'));

      // Assert
      expect(component.isEdit).toBe(true);
      expect(component.loading).toBe(true);
      expect(vehicleServiceMock.getById).toHaveBeenCalledWith('v1');

      const data = { id: 'v1' } as Vehicle;
      response$.next({ data } as WebApiResponse<Vehicle>);

      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
      expect(tripServiceMock.getByVehicleId).toHaveBeenCalledWith('v1');
      expect(component.tripAgendaEvents).toEqual([{ id: 'agenda1' }]);
    });

    it('should navigate to not-found when the vehicle does not exist', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Vehicle>>();
      vehicleServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();
      paramMap$.next(paramMap('missing'));

      // Act
      response$.next({ data: null } as unknown as WebApiResponse<Vehicle>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Vehicle>>();
      vehicleServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();
      paramMap$.next(paramMap('v1'));

      // Act
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should fall back to an empty trip list when the response has no data', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Vehicle>>();
      vehicleServiceMock.getById.mockReturnValue(response$);
      tripServiceMock.getByVehicleId.mockReturnValue(of({} as WebApiResponse<Trip[]>));
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('v1'));
      response$.next({ data: { id: 'v1' } } as WebApiResponse<Vehicle>);

      // Assert
      expect(component.tripAgendaEvents).toEqual([]);
    });

    it('should fall back to an empty leg list when building a trip agenda event', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Vehicle>>();
      vehicleServiceMock.getById.mockReturnValue(response$);
      const trip = { id: 'trip1' } as Trip;
      tripServiceMock.getByVehicleId.mockReturnValue(of({ data: [trip] } as WebApiResponse<Trip[]>));
      tripLegServiceMock.getByTrip.mockReturnValue(of({} as WebApiResponse<unknown>));
      tripServiceMock.buildAgendaEvent.mockReturnValue({ id: 'agenda1' });
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('v1'));
      response$.next({ data: { id: 'v1' } } as WebApiResponse<Vehicle>);

      // Assert
      expect(tripServiceMock.buildAgendaEvent).toHaveBeenCalledWith(trip, []);
    });

    it('should re-fetch on a real vehicleChanged$ event but not on the skip(1)-dropped first one', () => {
      // Arrange
      const component = createComponent();
      const firstResponse$ = new Subject<WebApiResponse<Vehicle>>();
      const secondResponse$ = new Subject<WebApiResponse<Vehicle>>();
      vehicleServiceMock.getById
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);
      component.ngOnInit();
      paramMap$.next(paramMap('v1'));
      firstResponse$.next({ data: { id: 'v1' } } as WebApiResponse<Vehicle>);
      expect(vehicleServiceMock.getById).toHaveBeenCalledTimes(1);

      // Act
      vehicleServiceMock.vehicleChanged$.next();
      expect(vehicleServiceMock.getById).toHaveBeenCalledTimes(1);

      vehicleServiceMock.vehicleChanged$.next();

      // Assert
      expect(vehicleServiceMock.getById).toHaveBeenCalledTimes(2);

      secondResponse$.next({ data: { id: 'v1' } } as WebApiResponse<Vehicle>);
      expect(component.data).toEqual({ id: 'v1' });
    });
  });

  describe('getStatusLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should resolve the translated status label when data has a known status', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: 'Available' } as Vehicle;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('VEHICLES.STATUS_AVAILABLE');
    });

    it('should fall back to an empty string when the status has no mapped label', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: 'Unknown' } as unknown as Vehicle;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should unsubscribe from vehicleChanged$/maintenanceChanged$ when editing an existing vehicle and ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();
    vehicleServiceMock.getById.mockReturnValue(new Subject());
    component.ngOnInit();
    paramMap$.next(paramMap('v1'));

    // Act
    component.ngOnDestroy();
    vehicleServiceMock.getById.mockClear();
    vehicleServiceMock.vehicleChanged$.next();
    vehicleServiceMock.vehicleChanged$.next();

    // Assert
    expect(vehicleServiceMock.getById).not.toHaveBeenCalled();
  });
});
