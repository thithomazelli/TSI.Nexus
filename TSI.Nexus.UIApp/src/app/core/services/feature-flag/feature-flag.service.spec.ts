import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, FeatureToggle, FeatureToggleKeys, WebApiResponse } from '@nexus/core';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let apiServiceMock: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
  let getResponse$: Subject<WebApiResponse<FeatureToggle[]>>;

  function createService(): FeatureFlagService {
    getResponse$ = new Subject();
    apiServiceMock = {
      get: vi.fn().mockReturnValue(getResponse$),
      put: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(FeatureFlagService);
  }

  function subscribeLatest<T>(obs: { subscribe: (fn: (v: T) => void) => void }): { value?: T } {
    const box: { value?: T } = {};
    obs.subscribe((v) => (box.value = v));
    return box;
  }

  it('should create the service and fire the initial load immediately when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
    expect(apiServiceMock.get).toHaveBeenCalledWith('featuretoggles/getAll');
  });

  it('should not emit from isEnabled() before the initial load resolves', () => {
    // Arrange
    const service = createService();

    // Act
    const box = subscribeLatest(service.isEnabled(FeatureToggleKeys.FleetModule));

    // Assert
    expect(box.value).toBeUndefined();
  });

  it('should emit true from isEnabled() when the toggle is explicitly enabled', () => {
    // Arrange
    const service = createService();
    const box = subscribeLatest(service.isEnabled(FeatureToggleKeys.FleetModule));

    // Act
    getResponse$.next({
      data: [{ key: FeatureToggleKeys.FleetModule, enabled: true } as FeatureToggle],
    } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();

    // Assert
    expect(box.value).toBe(true);
  });

  it('should emit false from isEnabled() when the toggle is explicitly disabled', () => {
    // Arrange
    const service = createService();
    const box = subscribeLatest(service.isEnabled(FeatureToggleKeys.FleetModule));

    // Act
    getResponse$.next({
      data: [{ key: FeatureToggleKeys.FleetModule, enabled: false } as FeatureToggle],
    } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();

    // Assert
    expect(box.value).toBe(false);
  });

  it('should fail open (true) from isEnabled() when the key is not registered', () => {
    // Arrange
    const service = createService();
    const box = subscribeLatest(service.isEnabled('SomeUnregisteredKey'));

    // Act
    getResponse$.next({
      data: [{ key: FeatureToggleKeys.FleetModule, enabled: false } as FeatureToggle],
    } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();

    // Assert
    expect(box.value).toBe(true);
  });

  it('should treat a missing response.data as an empty toggle set rather than throwing', () => {
    // Arrange
    const service = createService();
    const box = subscribeLatest(service.isEnabled(FeatureToggleKeys.FleetModule));

    // Act
    getResponse$.next({ data: undefined } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();

    // Assert
    expect(box.value).toBe(true);
  });

  it('should delegate to isEnabled(FleetModule) when isFleetModuleEnabled is called', () => {
    // Arrange
    const service = createService();
    const box = subscribeLatest(service.isFleetModuleEnabled());

    // Act
    getResponse$.next({
      data: [{ key: FeatureToggleKeys.FleetModule, enabled: true } as FeatureToggle],
    } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();

    // Assert
    expect(box.value).toBe(true);
  });

  it('should re-fetch and have isEnabled() reflect the updated set when refresh is called', () => {
    // Arrange
    const service = createService();
    getResponse$.next({
      data: [{ key: FeatureToggleKeys.FleetModule, enabled: true } as FeatureToggle],
    } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();
    const secondResponse$ = new Subject<WebApiResponse<FeatureToggle[]>>();
    apiServiceMock.get.mockReturnValue(secondResponse$);

    // Act
    service.refresh();
    const box = subscribeLatest(service.isEnabled(FeatureToggleKeys.FleetModule));
    expect(box.value).toBe(true); // still reflects the pre-refresh value until the new response lands
    secondResponse$.next({
      data: [{ key: FeatureToggleKeys.FleetModule, enabled: false } as FeatureToggle],
    } as unknown as WebApiResponse<FeatureToggle[]>);
    TestBed.flushEffects();

    // Assert
    expect(box.value).toBe(false);
  });

  it('should PUT to the expected URL and trigger a refresh when setEnabled is called', () => {
    // Arrange
    const service = createService();
    const putResponse$ = new Subject<WebApiResponse<FeatureToggle>>();
    apiServiceMock.put.mockReturnValue(putResponse$);
    apiServiceMock.get.mockClear();

    // Act
    service.setEnabled(FeatureToggleKeys.FleetModule, false).subscribe();
    putResponse$.next({
      data: { key: FeatureToggleKeys.FleetModule, enabled: false },
    } as unknown as WebApiResponse<FeatureToggle>);

    // Assert
    expect(apiServiceMock.put).toHaveBeenCalledWith(
      'featuretoggles/setEnabled/FleetModule/false',
      null,
    );
    expect(apiServiceMock.get).toHaveBeenCalledTimes(1);
  });

  it('should pass straight through to ApiService without touching the cached signal when getAll is called', () => {
    // Arrange
    const service = createService();
    const allResponse$ = new Subject<WebApiResponse<FeatureToggle[]>>();
    apiServiceMock.get.mockReturnValue(allResponse$);

    // Act
    const box = subscribeLatest(service.getAll());
    allResponse$.next({ data: [] } as unknown as WebApiResponse<FeatureToggle[]>);

    // Assert
    expect(box.value).toEqual({ data: [] });
  });
});
