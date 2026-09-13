import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { Driver, DriverService, TranslationService, WebApiResponse } from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { DriverDetailsPageComponent } from './driver-details-page.component';

describe('DriverDetailsPageComponent', () => {
  let paramMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { paramMap: Subject<{ get: (key: string) => string | null }> };
  let driverServiceMock: { getById: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };

  function createComponent(): DriverDetailsPageComponent {
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    driverServiceMock = { getById: vi.fn().mockReturnValue(new Subject()) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new DriverDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          translationServiceMock as unknown as TranslationService,
          driverServiceMock as unknown as DriverService,
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

  it('should return false from isAgendaEnabled when either flag is disabled', () => {
    // Arrange
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    driverServiceMock = { getById: vi.fn().mockReturnValue(new Subject()) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    featureFlagServiceMock = { isEnabled: vi.fn((key: string) => of(key === 'AgendaModule')) };
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(
      () =>
        new DriverDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          translationServiceMock as unknown as TranslationService,
          driverServiceMock as unknown as DriverService,
          routerMock as unknown as Router,
          featureFlagServiceMock as unknown as FeatureFlagService,
        ),
    );

    // Act / Assert
    expect(component.isAgendaEnabled()).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false and clear data when the id is "new"', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('new'));

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing driver when an id is provided', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Driver>>();
      driverServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('d1'));
      expect(component.isEdit).toBe(true);
      expect(component.loading).toBe(true);
      expect(driverServiceMock.getById).toHaveBeenCalledWith('d1');
      const data = { id: 'd1' } as Driver;
      response$.next({ data } as WebApiResponse<Driver>);

      // Assert
      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
    });

    it('should navigate to not-found when the driver does not exist', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Driver>>();
      driverServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('missing'));
      response$.next({ data: null } as unknown as WebApiResponse<Driver>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<Driver>>();
      driverServiceMock.getById.mockReturnValue(response$);
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('d1'));
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });
  });

  describe('getStatusLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should resolve the translated status label when data is set', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: 'Active' } as Driver;

      // Act / Assert
      expect(component.getStatusLabel()).toBe('DRIVERS.STATUS_ACTIVE');
    });

    it('should fall back to an empty string when the status has no mapped label', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: 'Unknown' } as unknown as Driver;

      // Act / Assert
      expect(component.getStatusLabel()).toBe('');
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
