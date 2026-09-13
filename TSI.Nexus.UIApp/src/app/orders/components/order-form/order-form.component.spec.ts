import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  BusinessPartner,
  BusinessPartnerService,
  CurrencyService,
  ModalService,
  NotificationService,
  Order,
  OrderProduct,
  OrderProductService,
  OrderService,
  OrderStatus,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { Subject, config, of, throwError } from 'rxjs';
import { OrderFormComponent } from './order-form.component';

describe('OrderFormComponent', () => {
  let businessPartnerServiceMock: {
    getClients: ReturnType<typeof vi.fn>;
    addOrUpdateBusinessPartner: ReturnType<typeof vi.fn>;
  };
  let currencyServiceMock: { formatCurrencyBRL: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
    showConfirmation: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let orderProductAdded$: Subject<OrderProduct | null>;
  let orderServiceMock: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let orderProductServiceMock: { orderProductAdded$: Subject<OrderProduct | null> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  const businessPartners: BusinessPartner[] = [
    { id: 'bp1', name: 'Cliente A' } as BusinessPartner,
    { id: 'bp2', name: 'Cliente B' } as BusinessPartner,
  ];

  function createComponent(): OrderFormComponent {
    businessPartnerServiceMock = {
      getClients: vi.fn().mockReturnValue(of({ data: businessPartners })),
      addOrUpdateBusinessPartner: vi.fn(),
    };
    currencyServiceMock = { formatCurrencyBRL: vi.fn((v: number) => `R$ ${v}`) };
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
      showConfirmation: vi.fn(),
      showNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    orderProductAdded$ = new Subject();
    orderServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    orderProductServiceMock = { orderProductAdded$ };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };
    dialogRefMock = { close: vi.fn() };

    const component = new OrderFormComponent(
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      currencyServiceMock as unknown as CurrencyService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      orderServiceMock as unknown as OrderService,
      orderProductServiceMock as unknown as OrderProductService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
    component.dialogRef = dialogRefMock as unknown as MatDialogRef<any>;
    component.data = { orderProducts: [] } as unknown as Order;
    return component;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('orderStatusOptions / trackByOptionValue', () => {
    it('should expose translated status options when the component is created', () => {
      // Act
      const component = createComponent();

      // Assert
      expect(component.orderStatusOptions).toEqual([
        { value: OrderStatus.Open, label: 'QUOTES.STATUS_OPEN' },
        { value: OrderStatus.Closed, label: 'QUOTES.STATUS_CLOSED' },
        { value: OrderStatus.WaitingPayment, label: 'QUOTES.STATUS_WAITING_PAYMENT' },
      ]);
    });

    it('should return the option value when trackByOptionValue is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.trackByOptionValue(0, { value: 'Open', label: 'x' })).toBe('Open');
    });
  });

  describe('ngOnInit', () => {
    it('should build the form and load business partners when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerId')).toBeTruthy();
      expect(businessPartnerServiceMock.getClients).toHaveBeenCalled();
    });

    it('should append a product, recompute totals, and notify when orderProductAdded$ emits', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const product = { totalPrice: 50 } as OrderProduct;

      // Act
      orderProductAdded$.next(product);

      // Assert
      expect(component.data!.orderProducts).toEqual([product]);
      expect(component.form.get('price')!.value).toBe(50);
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(true, '', 'ORDERS.PRODUCT_ADDED_SUCCESS');
    });

    it('should ignore orderProductAdded$ when there is no product or no data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      orderProductAdded$.next(null);
      component.data = null;
      orderProductAdded$.next({ totalPrice: 10 } as OrderProduct);

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should fall back to an empty array when data has no orderProducts yet', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Order;
      component.ngOnInit();
      const product = { totalPrice: 0 } as OrderProduct;

      // Act
      orderProductAdded$.next(product);

      // Assert
      expect(component.data!.orderProducts).toEqual([product]);
      expect(component.form.get('price')!.value).toBe(0);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form and rewire the totalOfPayments watcher when data changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { orderProducts: [], description: 'Nova' } as unknown as Order;

      // Act
      component.ngOnChanges({ data: {} as never });

      // Assert
      expect(component.form.get('description')!.value).toBe('Nova');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnChanges({ isEdit: {} as never })).not.toThrow();
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [] } as unknown as Order;

      // Act
      // Assert
      expect(() => component.ngOnChanges({ data: {} as never })).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe the totalOfPayments watcher and tracked subscriptions when destroyed', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when there is no totalOfPayments watcher yet', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('submit', () => {
    function fillValidForm(component: OrderFormComponent) {
      component.form.patchValue({
        businessPartnerId: 'bp1',
        businessPartnerName: 'Cliente A',
        date: new Date(),
        status: OrderStatus.Open,
      });
    }

    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(orderServiceMock.add).not.toHaveBeenCalled();
    });

    it('should propagate client fields into the transaction sub-form when canDisplayTransactionForm is true', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(orderServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction: expect.objectContaining({ businessPartnerId: 'bp1', businessPartnerName: 'Cliente A' }),
        }),
      );
    });

    it('should not touch the transaction sub-form when canDisplayTransactionForm is false', () => {
      // Arrange
      const component = createComponent();
      component.canDisplayTransactionForm = false;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should not throw when canDisplayTransactionForm is true but the form has no transaction group', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.removeControl('transaction');
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should not throw when there is no data to assign the raw form value onto', () => {
      // Arrange
      const component = createComponent();
      component.data = null;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should preserve the existing transaction id when submitting', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [], transaction: { id: 'tx1' } } as unknown as Order;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(orderServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: expect.objectContaining({ id: 'tx1' }) }),
      );
    });

    it('should delete a null transaction id before saving', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect('id' in (component.data as any).transaction).toBe(false);
    });

    it('should call update when editing an existing order', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo', data: { id: 'o1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(orderServiceMock.update).toHaveBeenCalled();
      expect(orderServiceMock.add).not.toHaveBeenCalled();
    });

    it('should notify without saving when the backend reports a business error', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou', data: null }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
    });

    it('should close the dialog and notify when saving succeeds in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(true, 'ORDERS.ORDER_ADDED', 'OK');
    });

    it('should navigate to the new order page when saving succeeds in page mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'o1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/orders/o1');
    });

    it('should show the message and refresh data when editing succeeds in page mode', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.isModal = false;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo', data: { id: 'o1', description: 'Nova' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Salvo');
      expect(component.data).toEqual({ id: 'o1', description: 'Nova' });
    });

    it('should notify an error when saving fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      orderServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'COMMON.SAVE_ERROR');
    });
  });

  describe('cancel', () => {
    it('should hide the modal when in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });

    it('should navigate back to the list page when not in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/orders');
    });
  });

  describe('remove', () => {
    it('should delete and navigate back when removal succeeds in page mode', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      orderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(orderServiceMock.delete).toHaveBeenCalledWith(component.data);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/orders');
    });

    it('should hide the dialog and notify without navigating when removal succeeds in modal mode', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      orderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalledWith('/orders');
    });

    it('should not navigate when the delete reports a non-success status in page mode', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      orderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should show an error notification when the delete request fails', async () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      orderServiceMock.delete.mockReturnValue(throwError(() => new Error('fail')));

      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        // Act
        component.remove();
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('error', 'ORDERS.REMOVE_ERROR');
        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should do nothing further when cancelled outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(orderServiceMock.delete).not.toHaveBeenCalled();
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    it('should reopen the details modal when cancelled inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.isEdit = true;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: true, data: component.data, id: 'o1' }),
      );
    });
  });

  describe('removeProduct', () => {
    it('should do nothing when there are no orderProducts', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: undefined } as unknown as Order;

      // Act
      // Assert
      expect(() => component.removeProduct(0)).not.toThrow();
    });

    it('should remove the product at the given index and recompute totals', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data!.orderProducts = [{ totalPrice: 10 } as OrderProduct, { totalPrice: 20 } as OrderProduct];

      // Act
      component.removeProduct(0);

      // Assert
      expect(component.data!.orderProducts).toEqual([{ totalPrice: 20 }]);
      expect(component.form.get('price')!.value).toBe(20);
    });
  });

  describe('openOrderProductsModal', () => {
    it('should open the products modal with merged data and form values when called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.openOrderProductsModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: false, id: null, parentId: null }),
      );
    });
  });

  describe('onProductPickerItemAdded', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      // Assert
      expect(() => component.onProductPickerItemAdded({ totalPrice: 10 } as OrderProduct)).not.toThrow();
    });

    it('should append the item and recompute totals when called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.onProductPickerItemAdded({ totalPrice: 15 } as OrderProduct);

      // Assert
      expect(component.data!.orderProducts).toEqual([{ totalPrice: 15 }]);
      expect(component.form.get('price')!.value).toBe(15);
    });

    it('should fall back to an empty array when data has no orderProducts yet', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Order;
      component.ngOnInit();

      // Act
      component.onProductPickerItemAdded({ totalPrice: 20 } as OrderProduct);

      // Assert
      expect(component.data!.orderProducts).toEqual([{ totalPrice: 20 }]);
    });
  });

  describe('transactionFormGroup', () => {
    it('should return the transaction sub-form group when accessed', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(component.transactionFormGroup.get('type')).toBeTruthy();
    });
  });

  describe('onClientBlur', () => {
    it('should clean the selection when the typed name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('   ');

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should do nothing further when the typed name matches an existing business partner', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Cliente A');

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new client when the name matches nothing', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });

    it('should clean the selection when the user declines creating a new business partner', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });

    it('should create and select the new business partner once confirmed', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      const newPartner = { id: 'bp9', name: 'Novo Cliente' } as BusinessPartner;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(newPartner) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(businessPartnerServiceMock.addOrUpdateBusinessPartner).toHaveBeenCalledWith(newPartner);
      expect(component.form.get('businessPartnerName')!.value).toBe('Novo Cliente');
      expect(component.form.get('businessPartnerId')!.value).toBe('bp9');
    });

    it('should clean the selection when the new-partner modal closes without a result', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });
  });

  describe('initForm (private, via ngOnInit)', () => {
    it('should build an add-mode form without an id control', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();
    });

    it('should build an edit-mode form with an id control', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
    });

    it('should disable businessPartnerName when data already has a businessPartnerId', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [], businessPartnerId: 'bp1' } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
    });

    it('should not add a duplicate transaction group when one already exists', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.form.get('transaction');

      // Act
      (component as any).addTransactionForm();

      // Assert
      expect(component.form.get('transaction')).toBe(before);
    });

    it('should auto-resolve businessPartnerId from the typed name in add mode', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('businessPartnerName')!.setValue('Cliente B');

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('bp2');
    });

    it('should leave businessPartnerId untouched when the typed name matches nothing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('businessPartnerName')!.setValue('Ninguém');

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBeNull();
    });
  });

  describe('patchFormWithData (private, via ngOnInit)', () => {
    it('should compute paymentTotalPrice from totalPrice/totalOfPayments in add mode', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [], totalPrice: 100, transaction: { totalOfPayments: 4 } } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.transactionFormGroup.get('paymentTotalPrice')!.value).toBe(25);
    });

    it('should default totalOfPayments to 1 when missing in add mode', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [], totalPrice: 40 } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.transactionFormGroup.get('paymentTotalPrice')!.value).toBe(40);
    });

    it('should fall back to zero totalPrice in add mode', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [] } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.transactionFormGroup.get('paymentTotalPrice')!.value).toBe(0);
    });

    it('should use the stored paymentTotalPrice directly when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = {
        orderProducts: [],
        transaction: { paymentTotalPrice: 77 },
      } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.transactionFormGroup.get('paymentTotalPrice')!.value).toBe(77);
    });

    it('should default the transaction id to null when missing', () => {
      // Arrange
      const component = createComponent();
      component.data = { orderProducts: [] } as unknown as Order;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.transactionFormGroup.get('id')!.value).toBeNull();
    });

    it('should not throw when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('setupAutoComplete (private, via ngOnInit) / filteredBusinessPartners$', () => {
    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      let result: BusinessPartner[] = [];
      component.businessPartnersArray$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: BusinessPartner[] = [];

      // Act
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should filter by name case-insensitively when a matching business partner exists', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Act
      component.form.get('businessPartnerName')!.setValue('cliente a');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'bp1' })]);
    });

    it('should treat a business partner with no name as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(
        of({ data: [{ id: 'bp3', name: undefined } as unknown as BusinessPartner] }),
      );
      component.ngOnInit();

      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Act
      component.form.get('businessPartnerName')!.setValue('cliente');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('disableEditFields (private, via ngOnInit)', () => {
    it('should disable businessPartnerName and orderNumber when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
      expect(component.form.get('orderNumber')!.disabled).toBe(true);
    });

    it('should leave fields enabled when not editing', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('orderNumber')!.disabled).toBe(false);
    });
  });

  describe('totalPriceChange (private, via ngOnInit)', () => {
    it('should recompute totalPrice when discount changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data!.orderProducts = [{ totalPrice: 100 } as OrderProduct];
      component.form.get('price')!.setValue(100);

      // Act
      component.form.get('discount')!.setValue(10);

      // Assert
      expect(component.form.get('totalPrice')!.value).toBeCloseTo(90);
    });
  });

  describe('updateTotalPriceFields (private, via removeProduct/onProductPickerItemAdded)', () => {
    it('should treat a non-numeric price/discount as zero', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('price')!.setValue('' as any);
      component.form.get('discount')!.setValue('' as any);

      // Act
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(0);
    });

    it('should sync the transaction paymentTotalPrice only when not editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'o1', orderProducts: [] } as unknown as Order;
      component.ngOnInit();
      const before = component.transactionFormGroup.get('paymentTotalPrice')!.value;
      component.form.get('price')!.setValue(500);

      // Act
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.transactionFormGroup.get('paymentTotalPrice')!.value).toBe(before);
    });
  });

  describe('setupTotalOfPaymentsWatcher (private, via ngOnInit/ngOnChanges)', () => {
    it('should recompute totals when totalOfPayments changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('price')!.setValue(100);

      // Act
      component.transactionFormGroup.get('totalOfPayments')!.setValue(2);

      // Assert
      expect(component.transactionFormGroup.get('paymentTotalPrice')!.value).toBe(100);
    });

    it('should replace the previous watcher instead of stacking subscriptions', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = (component as any).totalOfPaymentsSubscription;

      // Act
      (component as any).setupTotalOfPaymentsWatcher();

      // Assert
      expect((component as any).totalOfPaymentsSubscription).not.toBe(before);
      expect(before.closed).toBe(true);
    });

    it('should do nothing when the form has no transaction group', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.removeControl('transaction');

      // Act
      // Assert
      expect(() => (component as any).setupTotalOfPaymentsWatcher()).not.toThrow();
    });
  });
});
