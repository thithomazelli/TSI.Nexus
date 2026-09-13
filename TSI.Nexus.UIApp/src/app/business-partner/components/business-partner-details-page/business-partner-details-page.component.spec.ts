import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  BusinessPartnerService,
  Company,
  Individual,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { BusinessPartnerDetailsPageComponent } from './business-partner-details-page.component';

describe('BusinessPartnerDetailsPageComponent', () => {
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let businessPartnerServiceMock: { getById: ReturnType<typeof vi.fn> };
  let routerMock: { url: string; navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { language$: Subject<string>; instant: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(id: string | null): BusinessPartnerDetailsPageComponent {
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(id) } } };
    businessPartnerServiceMock = { getById: vi.fn().mockReturnValue(new Subject()) };
    routerMock = { url: '/clients', navigateByUrl: vi.fn() };
    translationServiceMock = { language$: new Subject(), instant: vi.fn((key: string) => key) };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    cdrMock = { markForCheck: vi.fn() };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new BusinessPartnerDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          businessPartnerServiceMock as unknown as BusinessPartnerService,
          routerMock as unknown as Router,
          translationServiceMock as unknown as TranslationService,
          featureFlagServiceMock as unknown as FeatureFlagService,
          cdrMock as unknown as ChangeDetectorRef,
        ),
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act / Assert
    expect(component.isAgendaEnabled()).toBe(true);
    expect(featureFlagServiceMock.isEnabled).toHaveBeenCalledWith('AgendaModule');
    expect(featureFlagServiceMock.isEnabled).toHaveBeenCalledWith('Event');
  });

  it('should return false from isAgendaEnabled when either flag is disabled', () => {
    // Arrange
    featureFlagServiceMock = { isEnabled: vi.fn((key: string) => of(key === 'AgendaModule')) };
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } } };
    businessPartnerServiceMock = { getById: vi.fn().mockReturnValue(new Subject()) };
    routerMock = { url: '/clients', navigateByUrl: vi.fn() };
    translationServiceMock = { language$: new Subject(), instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(
      () =>
        new BusinessPartnerDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          businessPartnerServiceMock as unknown as BusinessPartnerService,
          routerMock as unknown as Router,
          translationServiceMock as unknown as TranslationService,
          featureFlagServiceMock as unknown as FeatureFlagService,
          cdrMock as unknown as ChangeDetectorRef,
        ),
    );

    // Act / Assert
    expect(component.isAgendaEnabled()).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should set up for a new business partner when there is no id param', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toEqual({ type: 'Client' });
    });

    it('should load an existing business partner and mark for check when an id is provided', () => {
      // Arrange
      const component = createComponent('bp1');
      const response$ = new Subject<WebApiResponse<Company | Individual>>();
      businessPartnerServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      expect(component.loading).toBe(true);
      expect(businessPartnerServiceMock.getById).toHaveBeenCalledWith('bp1');
      const data = { id: 'bp1' } as Individual;
      response$.next({ data } as WebApiResponse<Individual>);

      // Assert
      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should navigate to not-found when the business partner does not exist', () => {
      // Arrange
      const component = createComponent('missing');
      const response$ = new Subject<WebApiResponse<Company | Individual>>();
      businessPartnerServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.next({ data: null } as unknown as WebApiResponse<Individual>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found, stop loading and mark for check when the request errors', () => {
      // Arrange
      const component = createComponent('bp1');
      const response$ = new Subject<WebApiResponse<Company | Individual>>();
      businessPartnerServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should re-initialize when the active language changes', () => {
      // Arrange
      const component = createComponent(null);
      component.ngOnInit();

      // Act
      routerMock.url = '/suppliers';
      translationServiceMock.language$.next('en');

      // Assert
      expect(component.baseEndPoint).toBe('suppliers');
      expect(component.canDisplayOrdersTab).toBe(false);
    });

    it('should set up for a new supplier when the route is under /suppliers', () => {
      // Arrange
      const component = createComponent(null);
      routerMock.url = '/suppliers';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.baseEndPoint).toBe('suppliers');
      expect(component.canDisplayOrdersTab).toBe(false);
      expect(component.data).toEqual({ type: 'Supplier' });
    });

    it('should leave baseEndPoint/title empty when the route is neither clients nor suppliers', () => {
      // Arrange
      const component = createComponent(null);
      routerMock.url = '/other';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.baseEndPoint).toBe('');
      expect(component.title).toBe('');
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
