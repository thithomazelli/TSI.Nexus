import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  PaymentService,
  PaymentStatus,
  PaymentType,
  Transaction,
  TransactionService,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { TransactionDetailsPageComponent } from './transaction-details-page.component';

describe('TransactionDetailsPageComponent', () => {
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let paymentServiceMock: { paymentChanged$: Subject<void> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let transactionServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    transactionChanged$: Subject<void>;
  };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };

  function createComponent(id: string | null): TransactionDetailsPageComponent {
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(id) } } };
    paymentServiceMock = { paymentChanged$: new Subject() };
    routerMock = { navigateByUrl: vi.fn() };
    transactionServiceMock = {
      getById: vi.fn().mockReturnValue(new Subject()),
      transactionChanged$: new Subject(),
    };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new TransactionDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          paymentServiceMock as unknown as PaymentService,
          routerMock as unknown as Router,
          transactionServiceMock as unknown as TransactionService,
          translationServiceMock as unknown as TranslationService,
          featureFlagServiceMock as unknown as FeatureFlagService,
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
    it('should set isEdit to false when there is no id for a new transaction', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing transaction when an id is provided', () => {
      // Arrange
      const component = createComponent('t1');
      const response$ = new Subject<WebApiResponse<Transaction>>();
      transactionServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      expect(component.loading).toBe(true);
      expect(transactionServiceMock.getById).toHaveBeenCalledWith('t1');
      const data = { id: 't1' } as Transaction;
      response$.next({ data } as WebApiResponse<Transaction>);

      // Assert
      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
    });

    it('should navigate to not-found when the transaction does not exist', () => {
      // Arrange
      const component = createComponent('missing');
      const response$ = new Subject<WebApiResponse<Transaction>>();
      transactionServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.next({ data: null } as unknown as WebApiResponse<Transaction>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should navigate to not-found and stop loading when the request errors', () => {
      // Arrange
      const component = createComponent('t1');
      const response$ = new Subject<WebApiResponse<Transaction>>();
      transactionServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should re-fetch on a real paymentChanged$ event but not on the skip(1)-dropped first one', () => {
      // Arrange
      const component = createComponent('t1');
      const firstResponse$ = new Subject<WebApiResponse<Transaction>>();
      const secondResponse$ = new Subject<WebApiResponse<Transaction>>();
      transactionServiceMock.getById
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);
      component.ngOnInit();
      firstResponse$.next({ data: { id: 't1' } } as WebApiResponse<Transaction>);
      expect(transactionServiceMock.getById).toHaveBeenCalledTimes(1);

      // Act
      paymentServiceMock.paymentChanged$.next();
      expect(transactionServiceMock.getById).toHaveBeenCalledTimes(1);

      paymentServiceMock.paymentChanged$.next();

      // Assert
      expect(transactionServiceMock.getById).toHaveBeenCalledTimes(2);
      secondResponse$.next({ data: { id: 't1' } } as WebApiResponse<Transaction>);
      expect(component.data).toEqual({ id: 't1' });
    });
  });

  describe('getTransactionStatusLabel/getPaymentTypeLabel', () => {
    it('should return an empty string when there is no data', () => {
      // Arrange
      const component = createComponent(null);

      // Act / Assert
      expect(component.getTransactionStatusLabel()).toBe('');
      expect(component.getPaymentTypeLabel()).toBe('');
    });

    it('should resolve translated labels when data is set', () => {
      // Arrange
      const component = createComponent(null);
      component.data = {
        status: PaymentStatus.Approved,
        type: PaymentType.Incoming,
      } as Transaction;

      // Act / Assert
      expect(component.getTransactionStatusLabel()).toBe('TRANSACTIONS.STATUS_APPROVED');
      expect(component.getPaymentTypeLabel()).toBe('REPORTS.INCOMING');
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent(null);
    component.ngOnInit();

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should also unsubscribe from transactionChanged$/paymentChanged$ when ngOnDestroy is called while editing an existing transaction', () => {
    // Arrange
    const component = createComponent('t1');
    transactionServiceMock.getById.mockReturnValue(new Subject());
    component.ngOnInit();

    // Act
    component.ngOnDestroy();
    transactionServiceMock.getById.mockClear();
    transactionServiceMock.transactionChanged$.next();
    transactionServiceMock.transactionChanged$.next();

    // Assert
    expect(transactionServiceMock.getById).not.toHaveBeenCalled();
  });
});
