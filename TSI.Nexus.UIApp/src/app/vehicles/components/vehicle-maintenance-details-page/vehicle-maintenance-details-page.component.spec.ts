import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  TranslationService,
  VehicleMaintenance,
  VehicleMaintenanceService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { VehicleMaintenanceDetailsPageComponent } from './vehicle-maintenance-details-page.component';

describe('VehicleMaintenanceDetailsPageComponent', () => {
  let paramMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { paramMap: Subject<{ get: (key: string) => string | null }> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let vehicleMaintenanceServiceMock: { getById: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };

  function createComponent(): VehicleMaintenanceDetailsPageComponent {
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    vehicleMaintenanceServiceMock = { getById: vi.fn().mockReturnValue(new Subject()) };
    routerMock = { navigateByUrl: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new VehicleMaintenanceDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          translationServiceMock as unknown as TranslationService,
          vehicleMaintenanceServiceMock as unknown as VehicleMaintenanceService,
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
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(component.isAgendaEnabled()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should navigate to not-found when there is no id param', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap(null));

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should load an existing maintenance when an id is provided', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<VehicleMaintenance>>();
      vehicleMaintenanceServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('vm1'));
      expect(component.loading).toBe(true);
      expect(vehicleMaintenanceServiceMock.getById).toHaveBeenCalledWith('vm1');
      const data = { id: 'vm1' } as VehicleMaintenance;
      response$.next({ data } as WebApiResponse<VehicleMaintenance>);

      // Assert
      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
    });

    it('should navigate to not-found when the maintenance does not exist', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<VehicleMaintenance>>();
      vehicleMaintenanceServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('missing'));
      response$.next({ data: null } as unknown as WebApiResponse<VehicleMaintenance>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<VehicleMaintenance>>();
      vehicleMaintenanceServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('vm1'));
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });
  });

  describe('getStatusInfo', () => {
    it('should return an empty label with a secondary color when there is no data', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getStatusInfo()).toEqual({ label: '', color: 'secondary' });
    });

    it('should resolve the label and color when the status is known', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: 'Completed' } as VehicleMaintenance;

      // Act / Assert
      expect(component.getStatusInfo()).toEqual({
        label: 'VEHICLES.MAINTENANCE_COMPLETED',
        color: 'success',
      });
    });

    it('should fall back to the raw status when the value is unknown', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: 'SomethingElse' } as unknown as VehicleMaintenance;

      // Act / Assert
      expect(component.getStatusInfo()).toEqual({ label: 'SomethingElse', color: 'secondary' });
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
