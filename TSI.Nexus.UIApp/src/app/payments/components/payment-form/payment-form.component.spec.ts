import { FormBuilder } from '@angular/forms';
import {
  ModalService,
  NotificationService,
  Order,
  Payment,
  PaymentCondition,
  PaymentMethod,
  PaymentService,
  PaymentStatus,
  PaymentType,
  SelectableOptionService,
  Transaction,
  TranslationService,
  Trip,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { PaymentFormComponent } from './payment-form.component';

describe('PaymentFormComponent', () => {
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let paymentServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let selectableOptionServiceMock: { getByGroup: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(): PaymentFormComponent {
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    paymentServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    selectableOptionServiceMock = { getByGroup: vi.fn().mockReturnValue(of({ data: [] })) };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new PaymentFormComponent(
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      paymentServiceMock as unknown as PaymentService,
      selectableOptionServiceMock as unknown as SelectableOptionService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  function validRawValue() {
    return {
      type: PaymentType.Incoming,
      status: PaymentStatus.Pending,
      condition: PaymentCondition.FullPayment,
      method: PaymentMethod.Cash,
      category: 'cat1',
      date: new Date(),
      description: 'Pagamento',
      installmentNumber: 0,
      price: 100,
    };
  }

  function fillValidForm(component: PaymentFormComponent) {
    component.form.patchValue(validRawValue());
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('option getters', () => {
    it('should expose translated status, type, method and condition options when read', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.statusOptions).toEqual([
        { label: 'REPORTS.STATUS_OPEN', value: PaymentStatus.Pending },
        { label: 'REPORTS.STATUS_PAID', value: PaymentStatus.Approved },
        { label: 'REPORTS.STATUS_DELAYED', value: PaymentStatus.Delayed },
      ]);
      expect(component.typeOptions).toEqual([
        { label: 'REPORTS.INCOMING', value: PaymentType.Incoming },
        { label: 'REPORTS.OUTGOING', value: PaymentType.Outgoing },
      ]);
      expect(component.methodOptions).toEqual([
        { label: 'TRANSACTIONS.METHOD_CASH', value: PaymentMethod.Cash },
        { label: 'TRANSACTIONS.METHOD_PIX', value: PaymentMethod.Pix },
        { label: 'TRANSACTIONS.METHOD_CREDIT_CARD', value: PaymentMethod.CreditCard },
      ]);
      expect(component.conditionOptions).toEqual([
        { label: 'TRANSACTIONS.FULL_PAYMENT', value: PaymentCondition.FullPayment },
        { label: 'TRANSACTIONS.IN_PAYMENTS', value: PaymentCondition.InInstallments },
      ]);
    });
  });

  describe('ngOnInit', () => {
    it('should build a form without an id control when adding', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();
    });

    it('should build a form with an id control when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
    });

    it('should patch the form with the provided data when data is set', () => {
      // Arrange
      const component = createComponent();
      component.data = { description: 'Pgto existente' } as Payment;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('description')!.value).toBe('Pgto existente');
    });

    it('should disable the form when the payment is already Approved', () => {
      // Arrange
      const component = createComponent();
      component.data = { status: PaymentStatus.Approved } as Payment;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.disabled).toBe(true);
    });

    it('should not disable the form when there is no data', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.disabled).toBe(false);
    });

    it('should disable businessPartnerName, orderNumber and type when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
      expect(component.form.get('orderNumber')!.disabled).toBe(true);
      expect(component.form.get('type')!.disabled).toBe(true);
    });

    it('should fall back to an empty array when the categories response has no data', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.categories).toEqual([]);
    });

    it('should load categories from the response data when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(
        of({ data: [{ value: 'cat1', label: 'Categoria 1' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.categories).toEqual([{ value: 'cat1', label: 'Categoria 1' }]);
    });

    it('should build the transaction-derived fields when parentData is Order-like', () => {
      // Arrange
      const component = createComponent();
      component.parentData = {
        id: 'o1',
        transactionId: 't1',
        transaction: { description: 'Desc do pedido' },
        businessPartnerId: 'bp1',
        businessPartnerName: 'Cliente',
        orderNumber: 'ORD-1',
      } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transactionId')!.value).toBe('t1');
      expect(component.form.get('transactionDescription')!.value).toBe('Desc do pedido');
      expect(component.form.get('orderId')!.value).toBe('o1');
      expect(component.form.get('tripId')!.value).toBe('');
    });

    it('should build the transaction-derived fields when parentData is Trip-like', () => {
      // Arrange
      const component = createComponent();
      component.parentData = {
        id: 'trip1',
        transactionId: 't2',
        transaction: null,
        tripNumber: 'TRIP-1',
      } as unknown as Trip;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('tripId')!.value).toBe('trip1');
      expect(component.form.get('orderId')!.value).toBe('');
      expect(component.form.get('transactionDescription')!.value).toBe('');
    });

    it('should fall back to empty strings when Order-like parentData has no transactionId or id', () => {
      // Arrange
      const component = createComponent();
      component.parentData = {
        id: '',
        transactionId: '',
        transaction: undefined,
        orderNumber: 'ORD-2',
      } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transactionId')!.value).toBe('');
      expect(component.form.get('orderId')!.value).toBe('');
    });

    it('should fall back to an empty tripId when Trip-like parentData has no id', () => {
      // Arrange
      const component = createComponent();
      component.parentData = {
        id: '',
        transactionId: 't3',
        tripNumber: 'TRIP-2',
      } as unknown as Trip;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('tripId')!.value).toBe('');
    });

    it('should build the transaction-derived fields when parentData is Transaction-like', () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'tx1';
      component.parentData = {
        description: 'Desc da transacao',
        orderId: 'o2',
        tripId: 'trip2',
      } as unknown as Transaction;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transactionDescription')!.value).toBe('Desc da transacao');
      expect(component.form.get('orderId')!.value).toBe('o2');
      expect(component.form.get('tripId')!.value).toBe('trip2');
      expect(component.form.get('transactionId')!.value).toBe('tx1');
    });

    it('should fall back to an empty transactionId when there is no parentId for a Transaction parent', () => {
      // Arrange
      const component = createComponent();
      component.parentId = null;
      component.parentData = { description: '', orderId: '', tripId: '' } as unknown as Transaction;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transactionId')!.value).toBe('');
    });

    it('should leave the transaction-derived fields empty when there is no parentData', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transactionId')!.value).toBe('');
      expect(component.form.get('orderId')!.value).toBe('');
      expect(component.form.get('tripId')!.value).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should patch the form when data changes to a new value after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { description: 'Novo' } as Payment;

      // Act
      component.ngOnChanges({ data: { currentValue: component.data } as never });

      // Assert
      expect(component.form.get('description')!.value).toBe('Novo');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ compact: { currentValue: true } as never });

      // Assert
      expect(component.form.get('description')!.value).toBe('');
    });

    it('should do nothing when data has no currentValue', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act / Assert
      expect(() =>
        component.ngOnChanges({ data: { currentValue: null } as never }),
      ).not.toThrow();
      expect(component.form.get('description')!.value).toBe('');
    });

    it('should do nothing when there is no form yet', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() =>
        component.ngOnChanges({ data: { currentValue: { description: 'X' } } as never }),
      ).not.toThrow();
    });

    it('should re-initialize the form when isEdit changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      expect(component.form.get('id')).toBeNull();
      component.isEdit = true;

      // Act
      component.ngOnChanges({
        isEdit: { currentValue: true, firstChange: false } as never,
      });

      // Assert
      expect(component.form.get('id')).toBeTruthy();
    });

    it('should not re-initialize the form on the first isEdit change', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.form;

      // Act
      component.ngOnChanges({
        isEdit: { currentValue: false, firstChange: true } as never,
      });

      // Assert
      expect(component.form).toBe(before);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe all tracked subscriptions when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const unsubscribe = vi.fn();
      (component as any)._subscriptions = [{ unsubscribe }];

      // Act
      component.ngOnDestroy();

      // Assert
      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should not throw when there are no subscriptions to clean up', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.form.get('type')!.touched).toBe(true);
      expect(paymentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should add a new payment when not editing and there is no existing data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      paymentServiceMock.add.mockReturnValue(
        of({ status: 'Success', message: 'OK', data: { id: 'p1' } } as WebApiResponse<Payment>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(paymentServiceMock.add).toHaveBeenCalled();
    });

    it('should merge the raw value into data and update when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'p1' } as Payment;
      component.ngOnInit();
      fillValidForm(component);
      paymentServiceMock.update.mockReturnValue(
        of({ status: 'Success', message: 'OK', data: { id: 'p1' } } as WebApiResponse<Payment>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(paymentServiceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', description: 'Pagamento' }),
      );
    });

    it('should add instead of update when isEdit is true but there is no existing data', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.ngOnInit();
      fillValidForm(component);
      paymentServiceMock.add.mockReturnValue(
        of({ status: 'Success', message: 'OK', data: { id: 'p1' } } as WebApiResponse<Payment>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(paymentServiceMock.add).toHaveBeenCalled();
      expect(paymentServiceMock.update).not.toHaveBeenCalled();
    });

    it('should close the dialog and show a sweet notification when the save succeeds', () => {
      // Arrange
      const component = createComponent();
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.ngOnInit();
      fillValidForm(component);
      paymentServiceMock.add.mockReturnValue(
        of({ status: 'Success', message: 'Salvo com sucesso' } as WebApiResponse<Payment>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Salvo com sucesso' }),
      );
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Salvo com sucesso',
        'Success',
      );
    });

    it('should notify an error when the save request fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      paymentServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'COMMON.SAVE_ERROR',
      );
    });
  });

  describe('cancel', () => {
    it('should hide the modal via the dialogRef when cancel is called', () => {
      // Arrange
      const component = createComponent();
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });
  });

  describe('remove', () => {
    it('should hide the current modal and delete via the modal path when confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.data = { id: 'p1' } as Payment;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      paymentServiceMock.delete.mockReturnValue(
        of({ status: 'Success', message: 'Removido' } as WebApiResponse<Payment>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith();
      expect(paymentServiceMock.delete).toHaveBeenCalledWith(component.data);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        'Success',
      );
    });

    it('should delete and notify without hiding the dialogRef when not a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'p1' } as Payment;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      paymentServiceMock.delete.mockReturnValue(
        of({ status: 'Success', message: 'Removido' } as WebApiResponse<Payment>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        'Success',
      );
    });

    it('should notify an error when the delete request fails', async () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'p1' } as Payment;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      paymentServiceMock.delete.mockReturnValue(throwError(() => new Error('fail')));

      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        // Act
        component.remove();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          'error',
          'ORDERS.REMOVE_ERROR',
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should not delete and should reopen the modal when cancelled inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.isEdit = true;
      component.data = { id: 'p1' } as Payment;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(paymentServiceMock.delete).not.toHaveBeenCalled();
      // Reopening the modal goes through a dynamic `import(...)` of
      // PaymentDetailsModalComponent, which is impractical to assert on
      // meaningfully in this spec (see product-form.component.spec.ts for
      // the same accepted residual pattern).
    });

    it('should do nothing further when cancelled outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'p1' } as Payment;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(paymentServiceMock.delete).not.toHaveBeenCalled();
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });
  });
});
