import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  ModalService,
  NotificationService,
  Product,
  ProductService,
  ProductType,
  Quote,
  QuoteProduct,
  QuoteProductService,
  QuoteService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { QuoteProductDetailsModalComponent } from '../quote-product-details-modal/quote-product-details-modal.component';
import { QuoteProductFormComponent } from './quote-product-form.component';

describe('QuoteProductFormComponent', () => {
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
    showConfirmation: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let quoteServiceMock: { getById: ReturnType<typeof vi.fn> };
  let quoteProductServiceMock: {
    addTemporary: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let productServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const products: Product[] = [
    { id: 'p1', sku: 'SKU1', name: 'Produto 1', price: 10, type: ProductType.Sale } as Product,
    { id: 'p2', sku: 'SKU2', name: 'Produto 2', price: 20, type: ProductType.Rental } as Product,
    { id: 'p3', sku: undefined, name: undefined, price: 30, type: ProductType.Sale } as unknown as Product,
  ];

  function createComponent(): QuoteProductFormComponent {
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
      showConfirmation: vi.fn(),
      showNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    quoteServiceMock = { getById: vi.fn() };
    quoteProductServiceMock = {
      addTemporary: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    productServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: products } as WebApiResponse<Product[]>)),
    };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new QuoteProductFormComponent(
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      quoteServiceMock as unknown as QuoteService,
      quoteProductServiceMock as unknown as QuoteProductService,
      productServiceMock as unknown as ProductService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should expose translated product type options when the component is instantiated', () => {
    // Arrange
    const component = createComponent();

    // Assert
    expect(component.productTypeOptions.length).toBe(3);
  });

  it('should return the option value when trackByOptionValue is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(component.trackByOptionValue(0, { value: 'Sale', label: 'x' })).toBe('Sale');
  });

  describe('ngOnInit', () => {
    it('should initialize a create-mode form and auto-resolve productId when productName matches a product', async () => {
      // Arrange
      const component = createComponent();

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();

      component.form.get('productName')!.setValue('Produto 1');
      expect(component.form.get('productId')!.value).toBe('p1');
    });

    it('should leave productId untouched when productName matches no product', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      // Act
      component.form.get('productName')!.setValue('Ninguém');

      // Assert
      expect(component.form.get('productId')!.value).toBe('');
    });

    it('should initialize an edit-mode form with an id control and disable sku/name when isEdit is true', async () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
      expect(component.form.get('productSku')!.disabled).toBe(true);
      expect(component.form.get('productName')!.disabled).toBe(true);
    });

    it('should patch the form with the provided data when data is set', async () => {
      // Arrange
      const component = createComponent();
      component.data = { productName: 'Produto 1', quantity: 5 } as QuoteProduct;

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.form.get('quantity')!.value).toBe(5);
    });

    it('should not throw when data is not provided', async () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      await expect(component.ngOnInit()).resolves.not.toThrow();
    });

    it('should recompute totalPrice when price, quantity, or discount change', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      vi.advanceTimersByTime(0);

      // Act
      component.form.get('price')!.setValue(100);
      component.form.get('quantity')!.setValue(2);
      component.form.get('discount')!.setValue(10);

      // Assert
      expect(component.form.get('totalPrice')!.value).toBeCloseTo(180);
    });

    it('should use parentData as the quote data without fetching it when parentData is provided', async () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'q1' } as Quote;

      // Act
      await component.ngOnInit();

      // Assert
      expect(quoteServiceMock.getById).not.toHaveBeenCalled();
    });

    it('should do nothing further when there is neither parentData nor parentId', async () => {
      // Arrange
      const component = createComponent();

      // Act
      await component.ngOnInit();

      // Assert
      expect(quoteServiceMock.getById).not.toHaveBeenCalled();
    });

    it('should fetch the parent quote by parentId when parentData is absent', async () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'q1';
      quoteServiceMock.getById.mockReturnValue(of({ data: { id: 'q1' } } as WebApiResponse<Quote>));

      // Act
      await component.ngOnInit();

      // Assert
      expect(quoteServiceMock.getById).toHaveBeenCalledWith('q1');
    });

    it('should fall back to null when the fetched quote response has no data', async () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'q1';
      quoteServiceMock.getById.mockReturnValue(of({} as WebApiResponse<Quote>));

      // Act
      // Assert
      await expect(component.ngOnInit()).resolves.not.toThrow();
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form when data changes after init', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();
      component.data = { quantity: 9 } as QuoteProduct;

      // Act
      component.ngOnChanges({ data: {} as any });

      // Assert
      expect(component.form.get('quantity')!.value).toBe(9);
    });

    it('should do nothing when the changed input is not data', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: {} as any });

      // Assert
      expect(component.form.get('quantity')!.value).toBe(1);
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { quantity: 9 } as QuoteProduct;

      // Act
      // Assert
      expect(() => component.ngOnChanges({ data: {} as any })).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe the productName auto-resolve subscription when ngOnDestroy is called', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      // Act
      component.ngOnDestroy();
      component.form.get('productName')!.setValue('Produto 1');

      // Assert
      expect(component.form.get('productId')!.value).toBe('');
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.submitted).toBe(true);
    });

    it('should create a temporary product when there is no parentId', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();
      component.form.patchValue({ productId: 'p1', price: 10 });
      quoteProductServiceMock.addTemporary.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success } as unknown as WebApiResponse<QuoteProduct>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(quoteProductServiceMock.addTemporary).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).not.toHaveBeenCalled();
    });

    it('should add instead of update when creating with a parentId', async () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'q1';
      quoteServiceMock.getById.mockReturnValue(of({ data: { id: 'q1' } } as WebApiResponse<Quote>));
      await component.ngOnInit();
      component.form.patchValue({ productId: 'p1', price: 10 });
      quoteProductServiceMock.add.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success } as unknown as WebApiResponse<QuoteProduct>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(quoteProductServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'q1' }),
      );
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'OK', ResponseStatus.Success);
    });

    it('should update when editing with a parentId', async () => {
      // Arrange
      const component = createComponent();
      component.parentId = 'q1';
      component.isEdit = true;
      component.data = { id: 'qp1' } as QuoteProduct;
      quoteServiceMock.getById.mockReturnValue(of({ data: { id: 'q1' } } as WebApiResponse<Quote>));
      await component.ngOnInit();
      component.form.get('productId')!.setValue('p1');
      component.form.get('price')!.setValue(10);
      quoteProductServiceMock.update.mockReturnValue(
        of({ message: 'Salvo', status: ResponseStatus.Success } as unknown as WebApiResponse<QuoteProduct>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(quoteProductServiceMock.update).toHaveBeenCalled();
      expect(quoteProductServiceMock.add).not.toHaveBeenCalled();
    });

    it('should close the dialog when saving succeeds and a dialogRef is present', async () => {
      // Arrange
      const component = createComponent();
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      await component.ngOnInit();
      component.form.patchValue({ productId: 'p1', price: 10 });
      quoteProductServiceMock.addTemporary.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success } as unknown as WebApiResponse<QuoteProduct>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should notify an error when saving fails', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();
      component.form.patchValue({ productId: 'p1', price: 10 });
      quoteProductServiceMock.addTemporary.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'COMMON.SAVE_ERROR');
    });
  });

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

  // save()'s `quoteProduct.orderId = this.parentId ?? undefined;` is only reached after the
  // `if (!this.parentId)` early-return above it, so at that point parentId is always truthy -
  // the `?? undefined` fallback is dead code, unreachable without altering the guard itself.
  describe('remove', () => {
    it('should delete and notify success outside a modal when confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'qp1' } as QuoteProduct;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      quoteProductServiceMock.delete.mockReturnValue(
        of({ message: 'Removido', status: ResponseStatus.Success } as unknown as WebApiResponse<QuoteProduct>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Removido', ResponseStatus.Success);
    });

    it('should hide the modal and notify success inside a modal when confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'qp1' } as QuoteProduct;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      quoteProductServiceMock.delete.mockReturnValue(
        of({ message: 'Removido', status: ResponseStatus.Success } as unknown as WebApiResponse<QuoteProduct>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'Removido', ResponseStatus.Success);
    });

    it('should notify an error when the delete request fails', async () => {
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.data = { id: 'qp1' } as QuoteProduct;
        modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
        quoteProductServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

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

    it('should do nothing further when the deletion is cancelled outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'qp1' } as QuoteProduct;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    it('should reopen the details modal when the deletion is cancelled inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.isEdit = true;
      component.data = { id: 'qp1' } as QuoteProduct;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        QuoteProductDetailsModalComponent,
        expect.objectContaining({ isEdit: true, data: component.data, id: 'qp1' }),
      );
    });
  });

  describe('selectProduct', () => {
    it('should do nothing when no product is given', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      // Act
      // Assert
      expect(() => component.selectProduct(null as unknown as Product)).not.toThrow();
      expect(component.form.get('productId')!.value).toBe('');
    });

    it('should re-add the productId control and patch the selected product when the control is missing', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();
      component.form.removeControl('productId');

      // Act
      component.selectProduct(products[0]);

      // Assert
      expect(component.form.get('productId')!.value).toBe('p1');
      expect(component.form.get('productSku')!.value).toBe('SKU1');
      expect(component.form.get('totalPrice')!.value).toBe(10);
    });

    it('should create a new data object when none exists yet', async () => {
      // Arrange
      const component = createComponent();
      component.data = null;
      await component.ngOnInit();

      // Act
      component.selectProduct(products[0]);

      // Assert
      expect(component.data).toMatchObject({ productId: 'p1', productSku: 'SKU1' });
    });

    it('should mutate the existing data object when one is already present', async () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'qp1' } as QuoteProduct;
      await component.ngOnInit();

      // Act
      component.selectProduct(products[1]);

      // Assert
      expect(component.data).toMatchObject({ id: 'qp1', productId: 'p2', productSku: 'SKU2' });
    });
  });

  describe('onProductSkuBlur', () => {
    it('should clean the selection when the typed sku is blank', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productSku')!.setValue('   ');

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('');
      expect(component.form.get('productId')!.hasError('required')).toBe(true);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should do nothing further when the typed sku matches an existing product', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU1');

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new product and select it when it is created', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU-NEW');

      const newProduct = { id: 'p9', sku: 'SKU-NEW', name: 'Novo', type: ProductType.Sale, price: 5 } as Product;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({
        afterClosed: () => of({ data: newProduct } as WebApiResponse<Product>),
      });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
      expect(component.form.get('productId')!.value).toBe('p9');
    });

    it('should clean the selection when the new-product modal closes without a result', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU-NEW');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('');
      expect(component.form.get('productId')!.hasError('required')).toBe(true);
    });

    it('should clean the selection when the user declines creating a new product', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productSku')!.setValue('SKU-NEW');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('productId')!.value).toBe('');
    });
  });

  describe('onProductNameBlur', () => {
    it('should clean the selection when the typed name is blank', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productName')!.setValue('   ');

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('');
    });

    it('should do nothing further when the typed name matches an existing product', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productName')!.setValue('Produto 1');

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new product and select it when it is created', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productName')!.setValue('Produto Novo');

      const newProduct = { id: 'p9', sku: 'SKU-NEW', name: 'Produto Novo', type: ProductType.Sale, price: 5 } as Product;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({
        afterClosed: () => of({ data: newProduct } as WebApiResponse<Product>),
      });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('p9');
    });

    it('should clean the selection when the new-product modal closes without a result', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productName')!.setValue('Produto Novo');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('productId')!.value).toBe('');
    });

    it('should clean the selection when the user declines creating a new product', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      component.form.get('productName')!.setValue('Produto Novo');

      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('productId')!.value).toBe('');
    });
  });

  describe('filteredProductsSku$ / filteredProductsName$', () => {
    it('should emit an empty list when there is no filter value', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];

      // Act
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should filter by sku case-insensitively and flag alreadyUsed when a matching product exists', async () => {
      // Arrange
      const component = createComponent();
      component.parentData = { quoteProducts: [{ productId: 'p1' } as QuoteProduct] };
      await component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (result = r));

      // Act
      component.form.get('productSku')!.setValue('sku1');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'p1', alreadyUsed: true })]);
    });

    it('should filter by name case-insensitively and flag alreadyUsed when a matching product exists', async () => {
      // Arrange
      const component = createComponent();
      component.parentData = { quoteProducts: [{ productId: 'p2' } as QuoteProduct] };
      await component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsName$.subscribe((r) => (result = r));

      // Act
      component.form.get('productName')!.setValue('produto 2');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'p2', alreadyUsed: true })]);
    });

    it('should resolve the filter value from an object emission when filtering by sku', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (result = r));

      // Act
      component.form.get('productSku')!.setValue({ sku: 'SKU2' } as unknown as string);

      // Assert
      expect(result[0]).toMatchObject({ id: 'p2' });
    });

    it('should resolve the filter value from an object emission when filtering by name', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsName$.subscribe((r) => (result = r));

      // Act
      component.form.get('productName')!.setValue({ name: 'Produto 2' } as unknown as string);

      // Assert
      expect(result[0]).toMatchObject({ id: 'p2' });
    });

    it('should fall back to an empty filter when an object emission is missing the expected field', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.form.get('productSku')!.setValue({} as unknown as string);
      component.form.get('productName')!.setValue({} as unknown as string);

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should fall back to an empty filter when the emission is neither a string nor an object', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.form.get('productSku')!.setValue(null);
      component.form.get('productName')!.setValue(null);

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should treat a product with no sku/name as an empty string when filtering', async () => {
      // Arrange
      const component = createComponent();
      await component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.form.get('productSku')!.setValue('sku1');
      component.form.get('productName')!.setValue('produto 2');

      // Assert
      expect(sku.find((p) => p.id === 'p3')).toBeUndefined();
      expect(name.find((p) => p.id === 'p3')).toBeUndefined();
    });
  });

  describe('setupAutoComplete', () => {
    it('should fall back to an empty array when the product response has no data', async () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(of({} as WebApiResponse<Product[]>));

      // Act
      await component.ngOnInit();

      let result: Product[] = [];
      component.productsArray$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('disableEditFields', () => {
    it('should disable productSku and productName when editing', async () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.form.get('productSku')!.disabled).toBe(true);
      expect(component.form.get('productName')!.disabled).toBe(true);
    });

    it('should leave fields enabled when not editing', async () => {
      // Arrange
      const component = createComponent();

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.form.get('productSku')!.disabled).toBe(false);
      expect(component.form.get('productName')!.disabled).toBe(false);
    });
  });

  describe('totalPriceChange (private, via ngOnInit)', () => {
    it('should not throw when the form has no quantity/discount controls', async () => {
      // Arrange
      const component = createComponent();
      vi.spyOn(component as any, 'initForm').mockImplementation(() => {
        component.form = new FormBuilder().group({
          productId: [''],
          productSku: [''],
          productName: [''],
          productType: [{ value: '', disabled: true }],
          price: [0],
          totalPrice: [{ value: 0, disabled: true }],
        });
      });

      // Act
      // Assert
      await expect(component.ngOnInit()).resolves.not.toThrow();
    });
  });

  describe('updateTotalPrice', () => {
    it('should treat a non-numeric quantity as zero when computing totalPrice', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      vi.advanceTimersByTime(0);

      // Act
      component.form.get('price')!.setValue(100);
      component.form.get('quantity')!.setValue('');

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(0);
    });

    it('should parse a Brazilian-formatted currency string price when computing totalPrice', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      await component.ngOnInit();
      vi.advanceTimersByTime(0);

      // Act
      component.form.get('price')!.setValue('R$ 1.234,50');
      component.form.get('quantity')!.setValue(2);
      component.form.get('discount')!.setValue(0);

      // Assert
      expect(component.form.get('totalPrice')!.value).toBeCloseTo(2469);
    });
  });
});
