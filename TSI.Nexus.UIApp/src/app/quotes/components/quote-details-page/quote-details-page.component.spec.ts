import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  ModalService,
  Quote,
  QuoteProductService,
  QuoteService,
  QuoteType,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { QuoteDetailsPageComponent } from './quote-details-page.component';

describe('QuoteDetailsPageComponent', () => {
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let quoteServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    getByQuoteNumber: ReturnType<typeof vi.fn>;
    getPdf: ReturnType<typeof vi.fn>;
    quoteChanged$: Subject<void>;
  };
  let quoteProductServiceMock: { quoteProductChanged$: Subject<void> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showPdfProgress: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let progressHandle: {
    setIndeterminate: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  function createComponent(id: string | null): QuoteDetailsPageComponent {
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(id) } } };
    quoteServiceMock = {
      getById: vi.fn().mockReturnValue(new Subject()),
      getByQuoteNumber: vi.fn().mockReturnValue(new Subject()),
      getPdf: vi.fn(),
      quoteChanged$: new Subject(),
    };
    quoteProductServiceMock = { quoteProductChanged$: new Subject() };
    routerMock = { navigateByUrl: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    progressHandle = { setIndeterminate: vi.fn(), success: vi.fn(), error: vi.fn() };
    modalServiceMock = { showPdfProgress: vi.fn().mockReturnValue(progressHandle) };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new QuoteDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          quoteServiceMock as unknown as QuoteService,
          quoteProductServiceMock as unknown as QuoteProductService,
          routerMock as unknown as Router,
          featureFlagServiceMock as unknown as FeatureFlagService,
          modalServiceMock as unknown as ModalService,
          translationServiceMock as unknown as TranslationService,
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
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false when there is no id for a new quote', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing quote when the id is a GUID', () => {
      // Arrange
      const guid = '11111111-1111-1111-1111-111111111111';
      const component = createComponent(guid);
      const response$ = new Subject<WebApiResponse<Quote>>();
      quoteServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      expect(quoteServiceMock.getById).toHaveBeenCalledWith(guid);
      expect(quoteServiceMock.getByQuoteNumber).not.toHaveBeenCalled();
      const data = { id: guid } as Quote;
      response$.next({ data } as WebApiResponse<Quote>);

      // Assert
      expect(component.data).toBe(data);
    });

    it('should load an existing quote by quote number when the id param is not a GUID', () => {
      // Arrange
      const component = createComponent('Q-1000');
      const response$ = new Subject<WebApiResponse<Quote>>();
      quoteServiceMock.getByQuoteNumber.mockReturnValue(response$);

      // Act
      component.ngOnInit();

      // Assert
      expect(quoteServiceMock.getByQuoteNumber).toHaveBeenCalledWith('Q-1000');
      expect(quoteServiceMock.getById).not.toHaveBeenCalled();
    });

    it('should navigate to not-found when the quote does not exist', () => {
      // Arrange
      const component = createComponent('Q-1000');
      const response$ = new Subject<WebApiResponse<Quote>>();
      quoteServiceMock.getByQuoteNumber.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.next({ data: null } as unknown as WebApiResponse<Quote>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const guid = '11111111-1111-1111-1111-111111111111';
      const component = createComponent(guid);
      const response$ = new Subject<WebApiResponse<Quote>>();
      quoteServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should re-fetch using the same fetch method on a real quoteProductChanged$ event but not on the skip(1)-dropped first one', () => {
      // Arrange
      const component = createComponent('Q-1000');
      const firstResponse$ = new Subject<WebApiResponse<Quote>>();
      const secondResponse$ = new Subject<WebApiResponse<Quote>>();
      quoteServiceMock.getByQuoteNumber
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);
      component.ngOnInit();
      firstResponse$.next({ data: { id: 'q1' } } as WebApiResponse<Quote>);
      expect(quoteServiceMock.getByQuoteNumber).toHaveBeenCalledTimes(1);

      // Act
      quoteProductServiceMock.quoteProductChanged$.next();
      expect(quoteServiceMock.getByQuoteNumber).toHaveBeenCalledTimes(1);

      quoteProductServiceMock.quoteProductChanged$.next();

      // Assert
      expect(quoteServiceMock.getByQuoteNumber).toHaveBeenCalledTimes(2);
      secondResponse$.next({ data: { id: 'q1' } } as WebApiResponse<Quote>);
      expect(component.data).toEqual({ id: 'q1' });
    });
  });

  describe('isTripQuote', () => {
    it('should reflect the quote type when isTripQuote is called', () => {
      // Arrange
      const component = createComponent(null);

      // Act / Assert
      component.data = { type: QuoteType.Trip } as Quote;
      expect(component.isTripQuote()).toBe(true);

      component.data = { type: QuoteType.Product } as Quote;
      expect(component.isTripQuote()).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act / Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should return an empty string when data has no status', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'q1', status: null } as unknown as Quote;

      // Act / Assert
      expect(component.getStatusLabel()).toBe('');
    });

    it('should resolve the mapped status label when data has a known status', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'q1', status: 'Open' } as unknown as Quote;

      // Act / Assert
      expect(component.getStatusLabel()).toBe('Em aberto');
    });

    it('should fall back to an empty string when the status has no mapped label', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'q1', status: 'Unknown' } as unknown as Quote;

      // Act / Assert
      expect(component.getStatusLabel()).toBe('');
    });
  });

  describe('emitQuote', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.emitQuote();

      // Assert
      expect(modalServiceMock.showPdfProgress).not.toHaveBeenCalled();
    });

    it('should show progress and report success when the PDF resolves', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'q1', quoteNumber: 'Q-1000' } as Quote;
      quoteServiceMock.getPdf.mockReturnValue(of(new Blob(['x'])));

      // Act
      component.emitQuote();

      // Assert
      expect(progressHandle.setIndeterminate).toHaveBeenCalled();
      expect(progressHandle.success).toHaveBeenCalled();
      expect(component.emittingQuote).toBe(false);
    });

    it('should report an error when PDF generation fails', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'q1', quoteNumber: 'Q-1000' } as Quote;
      const error$ = new Subject<Blob>();
      quoteServiceMock.getPdf.mockReturnValue(error$);

      // Act
      component.emitQuote();
      error$.error(new Error('boom'));

      // Assert
      expect(progressHandle.error).toHaveBeenCalled();
      expect(component.emittingQuote).toBe(false);
    });

    it('should do nothing while a previous emission is still in flight', () => {
      // Arrange
      const component = createComponent(null);
      component.data = { id: 'q1', quoteNumber: 'Q-1000' } as Quote;
      component.emittingQuote = true;

      // Act
      component.emitQuote();

      // Assert
      expect(modalServiceMock.showPdfProgress).not.toHaveBeenCalled();
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent(null);
    component.ngOnInit();

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should also unsubscribe from quoteChanged$/quoteProductChanged$ when ngOnDestroy is called while editing an existing quote', () => {
    // Arrange
    const guid = '11111111-1111-1111-1111-111111111111';
    const component = createComponent(guid);
    quoteServiceMock.getById.mockReturnValue(new Subject());
    component.ngOnInit();

    // Act
    component.ngOnDestroy();
    quoteServiceMock.getById.mockClear();
    quoteServiceMock.quoteChanged$.next();
    quoteServiceMock.quoteChanged$.next();

    // Assert
    expect(quoteServiceMock.getById).not.toHaveBeenCalled();
  });
});
