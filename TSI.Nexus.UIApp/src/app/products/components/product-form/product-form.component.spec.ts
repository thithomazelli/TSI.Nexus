import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalService,
  NotificationService,
  Product,
  ProductService,
  ProductType,
  ProductUnit,
  ResponseStatus,
  SelectableOptionService,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let productServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let selectableOptionServiceMock: { getByGroup: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): ProductFormComponent {
    modalServiceMock = {
      hideModal: vi.fn(),
      showNotification: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showTemplateModal: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    productServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    selectableOptionServiceMock = { getByGroup: vi.fn().mockReturnValue(of({ data: [] })) };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new ProductFormComponent(
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      productServiceMock as unknown as ProductService,
      routerMock as unknown as Router,
      selectableOptionServiceMock as unknown as SelectableOptionService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function validRawValue() {
    return {
      sku: 'SKU-1',
      name: 'Produto A',
      description: '',
      price: 10,
      unit: ProductUnit.Unit,
      type: ProductType.Rental,
      quantityInStock: 5,
      photo: '',
      category: 'cat1',
    };
  }

  function fillValidForm(component: ProductFormComponent) {
    component.form.patchValue(validRawValue());
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should expose translated unit and product type options when constructed', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.unitOptions.length).toBe(3);
    expect(component.productTypeOptions.length).toBe(3);
  });

  describe('ngOnInit', () => {
    it('should build a form without an id control when adding a new product', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();
    });

    it('should build a form with an id control when editing an existing product', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
    });

    it('should patch the form with the provided data when ngOnInit runs', () => {
      // Arrange
      const component = createComponent();
      component.data = { name: 'Produto B' } as Product;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('name')!.value).toBe('Produto B');
    });

    it('should load categories and fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.categories).toEqual([]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should load categories from the response data when the response has data', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(
        of({ data: [{ id: 'cat1', name: 'Categoria 1' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.categories).toEqual([{ id: 'cat1', name: 'Categoria 1' }]);
    });
  });

  describe('ngOnChanges', () => {
    it('should patch the form when data changes to a new value after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { name: 'Produto C' } as Product;

      // Act
      component.ngOnChanges({ data: { currentValue: component.data } as never });

      // Assert
      expect(component.form.get('name')!.value).toBe('Produto C');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ compact: { currentValue: true } as never });

      // Assert
      expect(component.form.get('name')!.value).toBe('');
    });

    it('should do nothing when data has no currentValue', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({ data: { currentValue: null } as never }),
      ).not.toThrow();
      expect(component.form.get('name')!.value).toBe('');
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

    it('should not re-initialize the form when isEdit changes on the first change', () => {
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
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect((component as any)._subscriptions).toEqual([]);
    });

    it('should not throw when there are no subscriptions to clean up', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('patchFormWithData (type -> quantityInStock)', () => {
    it('should zero and disable quantityInStock when the type changes to Service', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('type')!.setValue(ProductType.Service);

      // Assert
      expect(component.form.get('quantityInStock')!.value).toBe(0);
      expect(component.form.get('quantityInStock')!.disabled).toBe(true);
    });

    it('should enable quantityInStock when the type changes away from Service', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('type')!.setValue(ProductType.Service);

      // Act
      component.form.get('type')!.setValue(ProductType.Sale);

      // Assert
      expect(component.form.get('quantityInStock')!.disabled).toBe(false);
    });

    it('should not throw when there is no data to patch', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should not track a subscription when the form has no type control', () => {
      // Arrange
      const component = createComponent();
      component.form = new FormBuilder().group({ other: [''] }) as any;

      // Act
      // Assert
      expect(() => (component as any).patchFormWithData()).not.toThrow();
      expect((component as any)._subscriptions).toEqual([]);
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      let result: unknown;

      // Act
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.form.get('sku')!.touched).toBe(true);
      expect(productServiceMock.add).not.toHaveBeenCalled();
    });

    it('should add a new product when not editing and there is no existing data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'p1' } } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(productServiceMock.add).toHaveBeenCalled();
    });

    it('should merge the raw value into data before saving and update when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'p1' } as Product;
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'p1' } } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(productServiceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', name: 'Produto A' }),
      );
    });

    it('should add instead of update when isEdit is true but there is no existing data', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'p1' } } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(productServiceMock.add).toHaveBeenCalled();
      expect(productServiceMock.update).not.toHaveBeenCalled();
    });

    it('should notify without saving when the backend reports a business-rule failure', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'SKU duplicado' } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'SKU duplicado',
      );
    });

    it('should save via the modal path when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'p1' }, message: 'OK' } as WebApiResponse<Product>),
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
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'p1' } } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/products/p1');
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'error',
        'Erro ao salvar',
      );
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
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/products');
    });
  });

  describe('remove', () => {
    it('should delete and notify success outside a modal when the deletion is confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'p1' } as Product;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      productServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<Product>),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/products');
    });

    it('should hide the modal and not navigate when the deletion succeeds inside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'p1' } as Product;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      productServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as WebApiResponse<Product>),
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
      component.data = { id: 'p1' } as Product;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      productServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as WebApiResponse<Product>),
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
        component.data = { id: 'p1' } as Product;
        modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
        productServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));

        // Act
        component.remove();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          'error',
          'Erro ao remover',
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
      component.data = { id: 'p1' } as Product;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(productServiceMock.delete).not.toHaveBeenCalled();
    });

    // The isModal=true reopen path loads ProductDetailsModalComponent via a dynamic import() (see
    // remove()'s comment on why) - unlike every other reopen-after-cancel pattern in this codebase
    // (a plain top-level import), that async module resolution doesn't settle within any number of
    // microtask/macrotask ticks under this bundler's test transform, making the "showTemplateModal
    // was called" branch impractical to assert here. The cancelled-outside-a-modal path above
    // already covers isModal=false; the isModal=true branch's only difference is this dynamic
    // import wrapping the exact same showTemplateModal call already verified there.
  });

  describe('saveModal (via submit)', () => {
    it('should show a success notification when saving via the modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        'Produto adicionado',
        'OK',
      );
    });

    it('should not throw when there is no dialogRef to close', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.dialogRef = undefined;
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' } as WebApiResponse<Product>),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });
  });

  describe('savePage (via submit)', () => {
    it('should notify and update local data when editing', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.isEdit = true;
      component.data = { id: 'p1' } as Product;
      component.ngOnInit();
      fillValidForm(component);
      const updated = { id: 'p1', name: 'Produto A' } as Product;
      productServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: updated } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
      expect(component.data).toBe(updated);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalledWith('/products/p1');
    });

    it('should navigate to the new product when adding', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      productServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'p2' } } as WebApiResponse<Product>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/products/p2');
    });
  });
});
