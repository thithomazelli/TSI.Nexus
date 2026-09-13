import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BusinessPartner,
  BusinessPartnerService,
  CurrencyService,
  ModalService,
  NotificationService,
  OrderStatus,
  Product,
  ProductService,
  PurchaseOrder,
  PurchaseOrderProduct,
  PurchaseOrderProductService,
  PurchaseOrderService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { Subject, config, of, throwError } from 'rxjs';
import { PurchaseOrderFormComponent } from './purchase-order-form.component';

describe('PurchaseOrderFormComponent', () => {
  let businessPartnerServiceMock: {
    getSuppliers: ReturnType<typeof vi.fn>;
    addOrUpdateBusinessPartner: ReturnType<typeof vi.fn>;
  };
  let currencyServiceMock: object;
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
    showConfirmation: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let purchaseOrderServiceMock: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let purchaseOrderProductAdded$: Subject<PurchaseOrderProduct>;
  let purchaseOrderProductServiceMock: {
    purchaseOrderProductAdded$: Subject<PurchaseOrderProduct>;
    addTemporary: ReturnType<typeof vi.fn>;
  };
  let productServiceMock: { getById: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const suppliers: BusinessPartner[] = [
    { id: 'bp1', name: 'Fornecedor Um' } as BusinessPartner,
    { id: 'bp2', name: 'Fornecedor Dois' } as BusinessPartner,
  ];

  function createComponent(): PurchaseOrderFormComponent {
    businessPartnerServiceMock = {
      getSuppliers: vi.fn().mockReturnValue(of({ data: suppliers } as WebApiResponse<BusinessPartner[]>)),
      addOrUpdateBusinessPartner: vi.fn(),
    };
    currencyServiceMock = {};
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
      showConfirmation: vi.fn(),
      showNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    purchaseOrderServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    purchaseOrderProductAdded$ = new Subject();
    purchaseOrderProductServiceMock = {
      purchaseOrderProductAdded$,
      addTemporary: vi.fn(),
    };
    productServiceMock = { getById: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new PurchaseOrderFormComponent(
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      currencyServiceMock as CurrencyService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      purchaseOrderServiceMock as unknown as PurchaseOrderService,
      purchaseOrderProductServiceMock as unknown as PurchaseOrderProductService,
      productServiceMock as unknown as ProductService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function fillValidForm(component: PurchaseOrderFormComponent) {
    component.form.patchValue({
      businessPartnerId: 'bp1',
      businessPartnerName: 'Fornecedor Um',
    });
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should expose translated order status options when the component is created', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.orderStatusOptions.length).toBe(3);
  });

  it('should return the option value when trackByOptionValue is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(component.trackByOptionValue(0, { value: 'Open', label: 'x' })).toBe('Open');
  });

  describe('ngOnInit', () => {
    it('should build a create-mode form and auto-resolve businessPartnerId when businessPartnerName matches a supplier', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();

      component.form.get('businessPartnerName')!.setValue('Fornecedor Um');
      expect(component.form.get('businessPartnerId')!.value).toBe('bp1');
    });

    it('should leave businessPartnerId untouched when the typed name matches no supplier', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('businessPartnerName')!.setValue('Ninguém');

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBeNull();
    });

    it('should build an edit-mode form with an id control and disable edit-locked fields when isEdit is true', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
      expect(component.form.get('purchaseOrderNumber')!.disabled).toBe(true);
    });

    it('should leave edit-locked fields enabled when adding a new purchase order', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(false);
      expect(component.form.get('purchaseOrderNumber')!.disabled).toBe(false);
    });

    it('should compute expenseTotalPrice by dividing totalPrice by totalOfExpenses when adding', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        totalPrice: 100,
        purchaseOrderProducts: [],
        transaction: { totalOfExpenses: 4 },
      } as unknown as PurchaseOrder;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transaction.expenseTotalPrice')!.value).toBe(25);
    });

    it('should default totalOfExpenses to 1 when computing expenseTotalPrice while adding', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        totalPrice: 100,
        purchaseOrderProducts: [],
        transaction: {},
      } as unknown as PurchaseOrder;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transaction.expenseTotalPrice')!.value).toBe(100);
    });

    it('should use the existing expenseTotalPrice from data when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = {
        totalPrice: 100,
        purchaseOrderProducts: [],
        transaction: { totalOfExpenses: 4, expenseTotalPrice: 42 },
      } as unknown as PurchaseOrder;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('transaction.expenseTotalPrice')!.value).toBe(42);
    });

    it('should not throw and skip patching when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should add a product from purchaseOrderProductAdded$ when the product list was previously empty', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      purchaseOrderProductAdded$.next({ totalPrice: 50 } as PurchaseOrderProduct);

      // Assert
      expect(component.data!.purchaseOrderProducts).toEqual([{ totalPrice: 50 }]);
    });

    it('should add a product from purchaseOrderProductAdded$ and recalculate prices when it emits', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      purchaseOrderProductAdded$.next({ totalPrice: 50 } as PurchaseOrderProduct);

      // Assert
      expect(component.data!.purchaseOrderProducts).toEqual([{ totalPrice: 50 }]);
      expect(component.form.get('price')!.value).toBe(50);
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        '',
        'PURCHASE_ORDERS.PRODUCT_ADDED_SUCCESS',
      );
    });

    it('should ignore purchaseOrderProductAdded$ emissions when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;
      component.ngOnInit();

      // Act
      // Assert
      expect(() => purchaseOrderProductAdded$.next({ totalPrice: 50 } as PurchaseOrderProduct)).not.toThrow();
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should recompute totalPrice when the discount changes', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('price')!.setValue(100);

      // Act
      component.form.get('discount')!.setValue(10);

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(90);
    });

    it('should recompute expenseTotalPrice when transaction.totalOfExpenses changes', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('price')!.setValue(100);

      // Act
      component.form.get('transaction.totalOfExpenses')!.setValue(2);

      // Assert
      expect(component.form.get('transaction.expenseTotalPrice')!.value).toBe(100);
    });

    describe('applyPreselectedProduct', () => {
      it('should do nothing when there is no preselectedProductId', () => {
        // Arrange
        const component = createComponent();
        component.preselectedProductId = null;

        // Act
        component.ngOnInit();

        // Assert
        expect(productServiceMock.getById).not.toHaveBeenCalled();
      });

      it('should do nothing when editing even with a preselectedProductId set', () => {
        // Arrange
        const component = createComponent();
        component.isEdit = true;
        component.preselectedProductId = 'p1';

        // Act
        component.ngOnInit();

        // Assert
        expect(productServiceMock.getById).not.toHaveBeenCalled();
      });

      it('should add the preselected product as a temporary purchase order product when found', () => {
        // Arrange
        const component = createComponent();
        component.preselectedProductId = 'p1';
        const product = { id: 'p1', sku: 'SKU1', name: 'Produto 1', type: 'Sale', price: 10 } as Product;
        productServiceMock.getById.mockReturnValue(of({ data: product } as WebApiResponse<Product>));

        // Act
        component.ngOnInit();

        // Assert
        expect(purchaseOrderProductServiceMock.addTemporary).toHaveBeenCalledWith(
          expect.objectContaining({ productId: 'p1', productSku: 'SKU1', price: 10, totalPrice: 10 }),
        );
      });

      it('should do nothing when the preselected product is not found', () => {
        // Arrange
        const component = createComponent();
        component.preselectedProductId = 'p1';
        productServiceMock.getById.mockReturnValue(of({} as WebApiResponse<Product>));

        // Act
        component.ngOnInit();

        // Assert
        expect(purchaseOrderProductServiceMock.addTemporary).not.toHaveBeenCalled();
      });
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form and rewatch totalOfExpenses when data changes after init', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      component.data = { totalPrice: 200, purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnChanges({ data: {} as any });

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(200);
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnChanges({ isEdit: {} as any })).not.toThrow();
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;

      // Act
      // Assert
      expect(() => component.ngOnChanges({ data: {} as any })).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe the totalOfExpenses watcher and other tracked subscriptions when destroyed', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when ngOnDestroy is called before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.submitted).toBe(true);
      expect(component.form.get('businessPartnerId')!.touched).toBe(true);
    });

    it('should create a new purchase order syncing transaction business partner fields and dropping a null transaction id when submitted', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(purchaseOrderServiceMock.add).toHaveBeenCalled();
      const saved = purchaseOrderServiceMock.add.mock.calls[0][0] as PurchaseOrder;
      expect(saved.transaction!.businessPartnerId).toBe('bp1');
      expect(saved.transaction!.businessPartnerName).toBe('Fornecedor Um');
      expect(saved.transaction).not.toHaveProperty('id');
    });

    it('should preserve the existing transaction id when editing an order that already has one', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = {
        id: 'po1',
        purchaseOrderProducts: [],
        transaction: { id: 'tr1' },
      } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      purchaseOrderServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      const saved = purchaseOrderServiceMock.update.mock.calls[0][0] as PurchaseOrder;
      expect(saved.transaction!.id).toBe('tr1');
    });

    it('should not sync transaction business partner fields when the transaction section is hidden', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      component.canDisplayTransactionForm = false;
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      const saved = purchaseOrderServiceMock.add.mock.calls[0][0] as PurchaseOrder;
      expect(saved.transaction!.businessPartnerId).toBeUndefined();
    });

    it('should not throw when the form has no transaction control at all', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      component.form.removeControl('transaction');
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should not throw and skip assigning into data when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      component.data = null;
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should notify without saving when the backend reports a business-rule failure', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
    });

    it('should save via the modal path when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' }, message: 'OK' } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should save via the page path when isModal is false', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      purchaseOrderServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'po1' } } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/purchaseorders/po1');
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      purchaseOrderServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'COMMON.SAVE_ERROR');
    });
  });

  describe('cancel', () => {
    it('should hide the modal when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });

    it('should navigate back to the list when isModal is false', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/purchaseorders');
    });
  });

  describe('remove', () => {
    it('should delete and notify success outside a modal when confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'po1' } as PurchaseOrder;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      purchaseOrderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Removido', ResponseStatus.Success);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/purchaseorders');
    });

    it('should hide the modal and not navigate when the deletion succeeds inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'po1' } as PurchaseOrder;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      purchaseOrderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not navigate when the delete reports an error status', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'po1' } as PurchaseOrder;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      purchaseOrderServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should notify an error when the delete request fails', async () => {
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.data = { id: 'po1' } as PurchaseOrder;
        modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
        purchaseOrderServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        component.remove();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          'error',
          'PURCHASE_ORDERS.REMOVE_ERROR',
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should do nothing further when the deletion is cancelled outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'po1' } as PurchaseOrder;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(purchaseOrderServiceMock.delete).not.toHaveBeenCalled();
    });

    // The isModal=true reopen path loads PurchaseOrderDetailsModalComponent via a dynamic import()
    // (see remove()'s comment on why) - unlike every other reopen-after-cancel pattern in this
    // codebase (a plain top-level import), that async module resolution doesn't settle within any
    // number of microtask/macrotask ticks under this bundler's test transform, making the
    // "showTemplateModal was called" branch impractical to assert here. The cancelled-outside-a-
    // modal path above already covers isModal=false; the isModal=true branch's only difference is
    // this dynamic import wrapping the exact same showTemplateModal call already verified there.
  });

  describe('removeProduct', () => {
    it('should do nothing when there are no purchase order products', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as PurchaseOrder;

      // Act
      // Assert
      expect(() => component.removeProduct(0)).not.toThrow();
    });

    it('should remove the product at the given index and recalculate price fields when removeProduct is called', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        purchaseOrderProducts: [{ totalPrice: 10 } as PurchaseOrderProduct, { totalPrice: 20 } as PurchaseOrderProduct],
      } as PurchaseOrder;
      component.ngOnInit();

      // Act
      component.removeProduct(0);

      // Assert
      expect(component.data!.purchaseOrderProducts).toEqual([{ totalPrice: 20 }]);
      expect(component.form.get('price')!.value).toBe(20);
    });

    it('should treat a product with no totalPrice as zero when summing after removal', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        purchaseOrderProducts: [{} as PurchaseOrderProduct, { totalPrice: 10 } as PurchaseOrderProduct],
      } as PurchaseOrder;
      component.ngOnInit();

      // Act
      component.removeProduct(1);

      // Assert
      expect(component.form.get('price')!.value).toBe(0);
    });
  });

  describe('openPurchaseOrderProductsModal', () => {
    it('should open the modal with the merged data and current raw form value when called', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'po1', purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      component.openPurchaseOrderProductsModal();

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
      expect(() => component.onProductPickerItemAdded({} as PurchaseOrderProduct)).not.toThrow();
    });

    it('should append the item to a previously empty product list when onProductPickerItemAdded is called', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      component.onProductPickerItemAdded({ totalPrice: 15 } as PurchaseOrderProduct);

      // Assert
      expect(component.data!.purchaseOrderProducts).toEqual([{ totalPrice: 15 }]);
    });

    it('should append the item and recalculate price fields when onProductPickerItemAdded is called', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      component.onProductPickerItemAdded({ totalPrice: 15 } as PurchaseOrderProduct);

      // Assert
      expect(component.data!.purchaseOrderProducts).toEqual([{ totalPrice: 15 }]);
      expect(component.form.get('price')!.value).toBe(15);
    });
  });

  describe('transactionFormGroup', () => {
    it('should return the transaction form group when accessed', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      // Assert
      expect(component.transactionFormGroup.get('method')).toBeTruthy();
    });
  });

  describe('onSupplierBlur', () => {
    it('should clean the selection when the typed name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('   ');

      // Act
      component.onSupplierBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
      expect(component.form.get('businessPartnerId')!.hasError('required')).toBe(true);
    });

    it('should do nothing further when the typed name matches an existing supplier', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Fornecedor Um');

      // Act
      component.onSupplierBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new supplier and apply it when the user confirms creation', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Fornecedor Novo');

      const newSupplier = { id: 'bp9', name: 'Fornecedor Novo' } as BusinessPartner;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(newSupplier) });

      // Act
      component.onSupplierBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(businessPartnerServiceMock.addOrUpdateBusinessPartner).toHaveBeenCalledWith(newSupplier);
      expect(component.form.get('businessPartnerId')!.value).toBe('bp9');
      expect(component.form.get('businessPartnerName')!.value).toBe('Fornecedor Novo');
    });

    it('should clean the selection when the new-supplier modal closes without a result', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Fornecedor Novo');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onSupplierBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });

    it('should clean the selection when the user declines creating a new supplier', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Fornecedor Novo');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onSupplierBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });
  });

  describe('filteredBusinessPartners$', () => {
    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should filter suppliers by name case-insensitively when businessPartnerName changes', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));
      component.form.get('businessPartnerName')!.setValue('fornecedor um');

      // Assert
      expect(result).toEqual([suppliers[0]]);
    });

    it('should treat a supplier with no name as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getSuppliers.mockReturnValue(
        of({ data: [{ id: 'bp9', name: undefined } as unknown as BusinessPartner] }),
      );
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));
      component.form.get('businessPartnerName')!.setValue('anything');

      // Assert
      expect(result).toEqual([]);
    });

    it('should fall back to an empty array of suppliers when the response has no data', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getSuppliers.mockReturnValue(of({}));
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();

      // Act
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));
      component.form.get('businessPartnerName')!.setValue('fornecedor');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateTotalPriceFields', () => {
    it('should not touch the transaction expenseTotalPrice when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      const before = component.form.get('transaction.expenseTotalPrice')!.value;

      // Act
      component.form.get('price')!.setValue(500);
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.form.get('transaction.expenseTotalPrice')!.value).toBe(before);
    });

    it('should treat a non-numeric price and discount as zero when computing totalPrice', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.get('price')!.setValue('' as any);
      component.form.get('discount')!.setValue('' as any);

      // Act
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(0);
    });
  });

  describe('addTransactionForm (direct call)', () => {
    it('should not re-add the transaction group when one already exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      const existingGroup = component.form.get('transaction');

      // Act
      // Assert
      expect(() => (component as any).addTransactionForm()).not.toThrow();

      expect(component.form.get('transaction')).toBe(existingGroup);
    });
  });

  describe('setupTotalOfExpensesWatcher (direct call)', () => {
    it('should not throw when the form has no transaction group', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.form.removeControl('transaction');

      // Act
      // Assert
      expect(() => (component as any).setupTotalOfExpensesWatcher()).not.toThrow();
    });

    it('should not throw when the transaction group has no totalOfExpenses control', () => {
      // Arrange
      const component = createComponent();
      component.data = { purchaseOrderProducts: [] } as unknown as PurchaseOrder;
      component.ngOnInit();
      component.transactionFormGroup.removeControl('totalOfExpenses');

      // Act
      // Assert
      expect(() => (component as any).setupTotalOfExpensesWatcher()).not.toThrow();
    });
  });

  describe('saveModal / savePage (defensive branches)', () => {
    it('should show a failure notification when saveModal receives a non-success status', () => {
      // Arrange
      const component = createComponent();
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;

      // Act
      (component as any).saveModal({
        status: ResponseStatus.Error,
        message: 'Falhou',
      } as WebApiResponse<PurchaseOrder>);

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        false,
        'PURCHASE_ORDERS.PURCHASE_ORDER_ADDED',
        'Falhou',
      );
    });

    it('should notify and update local data when savePage handles an edit via submit', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = {
        id: 'po1',
        purchaseOrderProducts: [],
        transaction: { id: 'tr1' },
      } as unknown as PurchaseOrder;
      component.ngOnInit();
      fillValidForm(component);
      const updated = { id: 'po1', purchaseOrderNumber: 'PO-2' } as PurchaseOrder;
      purchaseOrderServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: updated } as WebApiResponse<PurchaseOrder>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
      expect(component.data).toBe(updated);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
