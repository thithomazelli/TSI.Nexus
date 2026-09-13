import { ModalService, Payment, PaymentService, PaymentStatus, TranslationService } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { PaymentNotificationComponent } from './payment-notification.component';

describe('PaymentNotificationComponent', () => {
  let paymentChanged$: Subject<void>;
  let paymentServiceMock: {
    paymentChanged$: Subject<void>;
    getDelayed: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(): PaymentNotificationComponent {
    paymentChanged$ = new Subject();
    paymentServiceMock = {
      paymentChanged$,
      getDelayed: vi.fn(),
    };
    modalServiceMock = { showTemplateModal: vi.fn() };
    routerMock = { navigate: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new PaymentNotificationComponent(
      modalServiceMock as unknown as ModalService,
      paymentServiceMock as unknown as PaymentService,
      routerMock as unknown as any,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / paymentChanged$', () => {
    it('should load the delayed payments when paymentChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      paymentServiceMock.getDelayed.mockReturnValue(
        of({ data: [{ id: 'p1' } as Payment, { id: 'p2' } as Payment] }),
      );

      // Act
      component.ngOnInit();
      paymentChanged$.next();

      // Assert
      expect(paymentServiceMock.getDelayed).toHaveBeenCalled();
      expect(component.payments).toEqual([{ id: 'p1' }, { id: 'p2' }]);
      expect(component.total).toBe(2);
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      paymentServiceMock.getDelayed.mockReturnValue(of({}));

      // Act
      component.ngOnInit();
      paymentChanged$.next();

      // Assert
      expect(component.payments).toEqual([]);
      expect(component.total).toBe(0);
    });

    it('should stop reloading when the component is destroyed', () => {
      // Arrange
      const component = createComponent();
      paymentServiceMock.getDelayed.mockReturnValue(of({ data: [{ id: 'p1' } as Payment] }));
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      paymentChanged$.next();

      // Assert
      expect(paymentServiceMock.getDelayed).not.toHaveBeenCalled();
    });

    it('should not throw when destroyed before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('displayPayments', () => {
    it('should return at most the first 10 payments when there are more than 10', () => {
      // Arrange
      const component = createComponent();
      component.payments = Array.from({ length: 15 }, (_, i) => ({ id: `p${i}` }) as Payment);

      // Act
      // Assert
      expect(component.displayPayments).toHaveLength(10);
      expect(component.displayPayments[0].id).toBe('p0');
    });
  });

  describe('showBadge', () => {
    it('should be true when there are payments', () => {
      // Arrange
      const component = createComponent();
      component.total = 1;

      // Act
      // Assert
      expect(component.showBadge).toBe(true);
    });

    it('should be false when there are no payments', () => {
      // Arrange
      const component = createComponent();
      component.total = 0;

      // Act
      // Assert
      expect(component.showBadge).toBe(false);
    });
  });

  describe('showSeeMore', () => {
    it('should be true when there are more than 10 payments', () => {
      // Arrange
      const component = createComponent();
      component.total = 11;

      // Act
      // Assert
      expect(component.showSeeMore).toBe(true);
    });

    it('should be false when there are 10 or fewer payments', () => {
      // Arrange
      const component = createComponent();
      component.total = 10;

      // Act
      // Assert
      expect(component.showSeeMore).toBe(false);
    });
  });

  describe('getStatusIcon', () => {
    it.each([
      [PaymentStatus.Delayed, 'bi bi-exclamation-triangle-fill text-danger'],
      [PaymentStatus.Pending, 'bi bi-hourglass-split text-info'],
      [PaymentStatus.Approved, 'bi bi-check-circle-fill text-success'],
    ])('should return %s icon when status is %s', (status, expected) => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getStatusIcon({ status } as Payment)).toBe(expected);
    });

    it('should fall back to a question-circle icon when the status is unknown', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getStatusIcon({ status: undefined } as Payment)).toBe(
        'bi bi-question-circle',
      );
    });
  });

  describe('getStatusText', () => {
    it.each([
      [PaymentStatus.Delayed, 'NAVBAR.PAYMENT_DELAYED'],
      [PaymentStatus.Pending, 'NAVBAR.PAYMENT_PENDING'],
      [PaymentStatus.Approved, 'NAVBAR.PAYMENT_APPROVED'],
    ])('should return %s when status is %s', (status, expectedKey) => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getStatusText({ status } as Payment)).toBe(expectedKey);
    });

    it('should fall back to an unknown-status translation when the status is not mapped', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getStatusText({ status: undefined } as Payment)).toBe(
        'NAVBAR.UNKNOWN_STATUS',
      );
    });
  });

  describe('getRelativeDate', () => {
    it('should return an empty string when there is no date', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getRelativeDate(undefined)).toBe('');
    });

    it('should return the today translation when the date is today', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getRelativeDate(new Date())).toBe('NAVBAR.TODAY');
    });

    it('should return the yesterday translation when the date is yesterday', () => {
      // Arrange
      const component = createComponent();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Act
      // Assert
      expect(component.getRelativeDate(yesterday)).toBe('NAVBAR.YESTERDAY');
    });

    it('should return a days-ago translation when the date is older than yesterday', () => {
      // Arrange
      const component = createComponent();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // Act
      component.getRelativeDate(fiveDaysAgo);

      // Assert
      expect(translationServiceMock.instant).toHaveBeenCalledWith('NAVBAR.DAYS_AGO', {
        days: '5',
      });
    });
  });

  describe('openModal', () => {
    it('should show the payment details modal with the payment data when openModal is called', () => {
      // Arrange
      const component = createComponent();
      const payment = { id: 'p1', transactionId: 't1' } as Payment;

      // Act
      component.openModal(payment);

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(expect.anything(), {
        isEdit: true,
        id: 'p1',
        data: payment,
        parentId: 't1',
      });
    });
  });

  describe('onSeeMore', () => {
    it('should navigate to payments filtered by pending/delayed status and today as end date when onSeeMore is called', () => {
      // Arrange
      const component = createComponent();
      const now = new Date(2024, 2, 5);
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Act
      component.onSeeMore();

      // Assert
      expect(routerMock.navigate).toHaveBeenCalledWith(['/payments'], {
        queryParams: {
          status: 'Pending,Delayed',
          endDate: '2024-03-05',
        },
      });
      vi.useRealTimers();
    });
  });
});
