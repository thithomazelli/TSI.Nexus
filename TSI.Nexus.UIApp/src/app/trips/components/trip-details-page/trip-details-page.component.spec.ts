import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  ModalService,
  PaymentService,
  TranslationService,
  Trip,
  TripService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { TripDetailsPageComponent } from './trip-details-page.component';

describe('TripDetailsPageComponent', () => {
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let tripServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    getContractPdf: ReturnType<typeof vi.fn>;
    getServiceOrderPdf: ReturnType<typeof vi.fn>;
    tripChanged$: Subject<void>;
  };
  let paymentServiceMock: { paymentChanged$: Subject<void> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showPdfProgress: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let progressHandle: { setIndeterminate: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(id: string | null): TripDetailsPageComponent {
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(id) } } };
    tripServiceMock = {
      getById: vi.fn().mockReturnValue(new Subject()),
      getContractPdf: vi.fn(),
      getServiceOrderPdf: vi.fn(),
      tripChanged$: new Subject(),
    };
    paymentServiceMock = { paymentChanged$: new Subject() };
    routerMock = { navigateByUrl: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    progressHandle = { setIndeterminate: vi.fn(), success: vi.fn(), error: vi.fn() };
    modalServiceMock = { showPdfProgress: vi.fn().mockReturnValue(progressHandle) };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new TripDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          tripServiceMock as unknown as TripService,
          paymentServiceMock as unknown as PaymentService,
          routerMock as unknown as Router,
          featureFlagServiceMock as unknown as FeatureFlagService,
          modalServiceMock as unknown as ModalService,
          translationServiceMock as unknown as TranslationService,
          cdrMock as unknown as ChangeDetectorRef,
        ),
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent(null)).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    // Assert
    expect(component.isAgendaEnabled()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false and default data to an empty object when creating a new trip', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toEqual({});
    });

    it('should load an existing trip and mark for check when ngOnInit runs', () => {
      // Arrange
      const component = createComponent('t1');
      const response$ = new Subject<WebApiResponse<Trip>>();
      tripServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      expect(component.loading).toBe(true);
      expect(tripServiceMock.getById).toHaveBeenCalledWith('t1');

      const data = { id: 't1' } as Trip;
      response$.next({ data } as WebApiResponse<Trip>);

      // Assert
      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should navigate to not-found when the trip does not exist', () => {
      // Arrange
      const component = createComponent('missing');
      const response$ = new Subject<WebApiResponse<Trip>>();
      tripServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.next({ data: null } as unknown as WebApiResponse<Trip>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found, stop loading and mark for check when the request errors', () => {
      // Arrange
      const component = createComponent('t1');
      const response$ = new Subject<WebApiResponse<Trip>>();
      tripServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should re-fetch on a real paymentChanged$ event but not on the skip(1)-dropped first one', () => {
      // Arrange
      const component = createComponent('t1');
      const firstResponse$ = new Subject<WebApiResponse<Trip>>();
      const secondResponse$ = new Subject<WebApiResponse<Trip>>();
      tripServiceMock.getById
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);

      // Act
      component.ngOnInit();
      firstResponse$.next({ data: { id: 't1' } } as WebApiResponse<Trip>);
      expect(tripServiceMock.getById).toHaveBeenCalledTimes(1);

      paymentServiceMock.paymentChanged$.next();
      expect(tripServiceMock.getById).toHaveBeenCalledTimes(1);

      paymentServiceMock.paymentChanged$.next();

      // Assert
      expect(tripServiceMock.getById).toHaveBeenCalledTimes(2);

      secondResponse$.next({ data: { id: 't1' } } as WebApiResponse<Trip>);
      expect(component.data).toEqual({ id: 't1' });
    });
  });

  describe('getStatusLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should return an empty string when data has no status', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1' } as Trip;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should resolve the mapped status label when status is Open', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1', status: 'Open' } as unknown as Trip;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('Em aberto');
    });

    it('should fall back to an empty string when the status has no mapped label', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1', status: 'Unknown' } as unknown as Trip;

      // Act
      // Assert
      expect(component.getStatusLabel()).toBe('');
    });
  });

  describe('emitContract', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.emitContract();

      // Assert
      expect(modalServiceMock.showPdfProgress).not.toHaveBeenCalled();
    });

    it('should show progress and report success when the PDF resolves', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1', tripNumber: 'V-1000' } as Trip;
      tripServiceMock.getContractPdf.mockReturnValue(of(new Blob(['x'])));

      // Act
      component.emitContract();

      // Assert
      expect(progressHandle.success).toHaveBeenCalled();
      expect(component.emittingContract).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should report an error and mark for check when PDF generation fails', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1', tripNumber: 'V-1000' } as Trip;
      const error$ = new Subject<Blob>();
      tripServiceMock.getContractPdf.mockReturnValue(error$);

      // Act
      component.emitContract();
      error$.error(new Error('boom'));

      // Assert
      expect(progressHandle.error).toHaveBeenCalled();
      expect(component.emittingContract).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('emitServiceOrder', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.emitServiceOrder();

      // Assert
      expect(modalServiceMock.showPdfProgress).not.toHaveBeenCalled();
    });

    it('should show progress and report success when the PDF resolves', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1', tripNumber: 'V-1000' } as Trip;
      tripServiceMock.getServiceOrderPdf.mockReturnValue(of(new Blob(['x'])));

      // Act
      component.emitServiceOrder();

      // Assert
      expect(progressHandle.success).toHaveBeenCalled();
      expect(component.emittingServiceOrder).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should report an error and mark for check when PDF generation fails', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 't1', tripNumber: 'V-1000' } as Trip;
      const error$ = new Subject<Blob>();
      tripServiceMock.getServiceOrderPdf.mockReturnValue(error$);

      // Act
      component.emitServiceOrder();
      error$.error(new Error('boom'));

      // Assert
      expect(progressHandle.error).toHaveBeenCalled();
      expect(component.emittingServiceOrder).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent(null);
    component.ngOnInit();

    // Act
    // Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should unsubscribe from tripChanged$ and paymentChanged$ when ngOnDestroy is called while editing an existing trip', () => {
    // Arrange
    const component = createComponent('t1');
    tripServiceMock.getById.mockReturnValue(new Subject());
    component.ngOnInit();

    // Act
    component.ngOnDestroy();
    tripServiceMock.getById.mockClear();
    tripServiceMock.tripChanged$.next();
    tripServiceMock.tripChanged$.next();

    // Assert
    expect(tripServiceMock.getById).not.toHaveBeenCalled();
  });
});
