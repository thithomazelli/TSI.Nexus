import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  CurrencyService,
  ModalService,
  Product,
  ProductService,
  ProductType,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { of } from 'rxjs';
import { ProductPickerGridComponent } from './product-picker-grid.component';

describe('ProductPickerGridComponent', () => {
  let currencyServiceMock: { formatCurrencyBRL: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    showConfirmation: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let productServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const products: Product[] = [
    { id: 'p1', sku: 'SKU1', name: 'Produto 1', price: 10, type: ProductType.Sale, quantityInStock: 5 } as Product,
    { id: 'p2', sku: 'SKU2', name: 'Produto 2', price: 20, type: ProductType.Rental, quantityInStock: 8 } as Product,
    { id: 'p3', sku: undefined, name: undefined, price: 30, type: ProductType.Sale, quantityInStock: 1 } as unknown as Product,
    { id: 'p4', sku: 'SKU4', name: 'Produto 4', price: 15, type: ProductType.Service } as Product,
    { id: 'p5', sku: 'SKU5', name: 'Produto 5', price: 25, type: ProductType.Sale, quantityInStock: 0 } as Product,
  ];

  function createComponent(): ProductPickerGridComponent {
    currencyServiceMock = { formatCurrencyBRL: vi.fn((v: number) => `R$ ${v}`) };
    modalServiceMock = {
      showConfirmation: vi.fn(),
      showTemplateModal: vi.fn(),
      showNotification: vi.fn(),
    };
    productServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: products } as WebApiResponse<Product[]>)),
    };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new ProductPickerGridComponent(
      currencyServiceMock as unknown as CurrencyService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
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
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the inline form and load products when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.inlineProductForm.get('productId')).toBeTruthy();
      expect(productServiceMock.getAll).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop the products subscription when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnDestroy();
      component.inlineProductForm.get('productSku')!.setValue('SKU1');

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });
  });

  describe('selectProduct', () => {
    it('should do nothing when no product is given', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const act = () => component.selectProduct(null as unknown as Product);

      // Assert
      expect(act).not.toThrow();
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });

    it('should patch the form with the selected product', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.selectProduct(products[0]);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('p1');
      expect(component.inlineProductForm.get('productSku')!.value).toBe('SKU1');
    });

    it('should allow a Service product with no stock when filterOutOfStock is true', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = true;
      component.ngOnInit();

      // Act
      component.selectProduct(products[3]);

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
      expect(component.inlineProductForm.get('productId')!.value).toBe('p4');
    });

    it('should block a zero-stock Sale product when filterOutOfStock is true', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = true;
      component.ngOnInit();

      // Act
      component.selectProduct(products[4]);

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        false,
        'PRODUCTS.OUT_OF_STOCK_TITLE',
        'PRODUCTS.OUT_OF_STOCK_MESSAGE',
      );
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });

    it('should block selection when quantityInStock is undefined', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = true;
      component.ngOnInit();
      const noStock = { id: 'p6', sku: 'SKU6', name: 'Sem estoque', type: ProductType.Sale } as Product;

      // Act
      component.selectProduct(noStock);

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalled();
    });

    it('should block selection when quantityInStock is null', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = true;
      component.ngOnInit();
      const noStock = { id: 'p6', sku: 'SKU6', name: 'Sem estoque', type: ProductType.Sale, quantityInStock: null } as unknown as Product;

      // Act
      component.selectProduct(noStock);

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalled();
    });

    it('should allow a zero-stock product when filterOutOfStock is false (purchase order flow)', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = false;
      component.ngOnInit();

      // Act
      component.selectProduct(products[4]);

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
      expect(component.inlineProductForm.get('productId')!.value).toBe('p5');
    });
  });

  describe('onProductSkuBlur', () => {
    it('should clean the selection when the typed sku is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('   ');

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should select the product when the typed sku matches an existing product', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU1');

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('p1');
    });

    it('should offer to create a new product when the sku matches nothing', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU-NEW');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });
  });

  describe('onProductNameBlur', () => {
    it('should clean the selection when the typed name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productName')!.setValue('   ');

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });

    it('should select the product when the typed name matches an existing product', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productName')!.setValue('Produto 1');

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('p1');
    });

    it('should offer to create a new product when the name matches nothing', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productName')!.setValue('Produto Novo');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });
  });

  describe('confirmAndCreateProduct (private, via onProductSkuBlur/onProductNameBlur)', () => {
    it('should clean the selection when the user declines creating a new product', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU-NEW');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });

    it('should create and select the new product once confirmed', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU-NEW');
      const newProduct = { id: 'p9', sku: 'SKU-NEW', name: 'Novo', type: ProductType.Sale, price: 5, quantityInStock: 5 } as Product;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({
        afterClosed: () => of({ data: newProduct } as WebApiResponse<Product>),
      });

      // Act
      component.onProductSkuBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('p9');
    });

    it('should clean the selection when the new-product modal closes without a result', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productName')!.setValue('Produto Novo');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });

    it('should fall back to an empty name when called with neither sku nor name', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      (component as any).confirmAndCreateProduct({});

      // Assert
      expect(translationServiceMock.instant).toHaveBeenCalledWith(
        'COMMON.CONFIRM_ADD_ENTITY',
        expect.objectContaining({ name: '' }),
      );
    });

    it('should use the name when there is no sku to compute the confirmation message', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productName')!.setValue('Produto Sem Sku');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onProductNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(translationServiceMock.instant).toHaveBeenCalledWith(
        'COMMON.CONFIRM_ADD_ENTITY',
        expect.objectContaining({ name: 'Produto Sem Sku' }),
      );
    });
  });

  describe('onQuantityBlur', () => {
    it('should do nothing when filterOutOfStock is false', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = false;
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU1');
      component.inlineProductForm.get('quantity')!.setValue(100);

      // Act
      component.onQuantityBlur();

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no quantity control', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.removeControl('quantity');
      component.inlineProductForm.get('productSku')!.setValue('SKU1');

      // Act
      const act = () => component.onQuantityBlur();

      // Assert
      expect(act).not.toThrow();
    });

    it('should do nothing when there is no productSku value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.onQuantityBlur();

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should do nothing when the product cannot be found', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('UNKNOWN');

      // Act
      const act = () => component.onQuantityBlur();

      // Assert
      expect(act).not.toThrow();
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should do nothing when the found product has no quantityInStock', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU4');

      // Act
      component.onQuantityBlur();

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });

    it('should do nothing when the requested quantity is within stock', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU1');
      component.inlineProductForm.get('quantity')!.setValue(3);

      // Act
      component.onQuantityBlur();

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
      expect(component.inlineProductForm.get('quantity')!.value).toBe(3);
    });

    it('should notify and reset to 1 when the requested quantity exceeds stock', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU1');
      component.inlineProductForm.get('quantity')!.setValue(10);

      // Act
      component.onQuantityBlur();

      // Assert
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        false,
        'PRODUCTS.STOCK_EXCEEDED_TITLE',
        'PRODUCTS.STOCK_EXCEEDED_MESSAGE',
      );
      expect(component.inlineProductForm.get('quantity')!.value).toBe(1);
    });
  });

  describe('addProduct', () => {
    it('should do nothing when there is no selected product', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      let emitted = false;
      component.itemAdded.subscribe(() => (emitted = true));

      // Act
      component.addProduct();

      // Assert
      expect(emitted).toBe(false);
    });

    it('should emit the staged item and clean the selection', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.selectProduct(products[0]);
      component.inlineProductForm.get('quantity')!.setValue(2);
      let emitted: any;
      component.itemAdded.subscribe((v) => (emitted = v));

      // Act
      component.addProduct();

      // Assert
      expect(emitted).toMatchObject({
        productId: 'p1',
        productSku: 'SKU1',
        quantity: 2,
        price: 10,
        totalPrice: 20,
        priceFormatted: 'R$ 10',
        totalPriceFormatted: 'R$ 20',
        discount: 0,
      });
      expect(component.inlineProductForm.get('productId')!.value).toBe('');
    });

    it('should default quantity to 1 and price to 0 when they are not numeric', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.selectProduct(products[0]);
      component.inlineProductForm.get('quantity')!.setValue('' as any);
      component.inlineProductForm.get('price')!.setValue('' as any);
      let emitted: any;
      component.itemAdded.subscribe((v) => (emitted = v));

      // Act
      component.addProduct();

      // Assert
      expect(emitted).toMatchObject({ quantity: 1, price: 0, totalPrice: 0 });
    });

    it('should do nothing when there is no productId even if productSku is set', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.inlineProductForm.get('productSku')!.setValue('SKU1');
      let emitted = false;
      component.itemAdded.subscribe(() => (emitted = true));

      // Act
      component.addProduct();

      // Assert
      expect(emitted).toBe(false);
    });
  });

  describe('removeItem / openModal', () => {
    it('should emit the removed index when removeItem is called', () => {
      // Arrange
      const component = createComponent();
      let removedIndex: number | undefined;
      component.itemRemoved.subscribe((i) => (removedIndex = i));

      // Act
      component.removeItem(3);

      // Assert
      expect(removedIndex).toBe(3);
    });

    it('should emit openManualModal when openModal is called', () => {
      // Arrange
      const component = createComponent();
      let opened = false;
      component.openManualModal.subscribe(() => (opened = true));

      // Act
      component.openModal();

      // Assert
      expect(opened).toBe(true);
    });
  });

  describe('trackBy helpers', () => {
    it('should return the product id when trackByProductId is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      const result = component.trackByProductId(0, { id: 'p1' } as Product);

      // Assert
      expect(result).toBe('p1');
    });

    it('should return the index when trackByIndex is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      const result = component.trackByIndex(4);

      // Assert
      expect(result).toBe(4);
    });
  });

  describe('filteredProductsSku$ / filteredProductsName$', () => {
    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];

      // Act
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should filter by sku case-insensitively and flag alreadyUsed when a matching product exists', () => {
      // Arrange
      const component = createComponent();
      component.items = [{ productId: 'p1' }];
      component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (result = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue('sku1');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'p1', alreadyUsed: true })]);
    });

    it('should filter by name case-insensitively and flag alreadyUsed when a matching product exists', () => {
      // Arrange
      const component = createComponent();
      component.items = [{ productId: 'p2' }];
      component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsName$.subscribe((r) => (result = r));

      // Act
      component.inlineProductForm.get('productName')!.setValue('produto 2');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'p2', alreadyUsed: true })]);
    });

    it('should treat a non-string filter value as an empty filter', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue({ sku: 'SKU1' } as unknown as string);
      component.inlineProductForm.get('productName')!.setValue(null);

      // Assert
      expect(sku).toEqual([]);
      expect(name).toEqual([]);
    });

    it('should treat a product with no sku/name as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      let sku: Product[] = [];
      let name: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));
      component.filteredProductsName$.subscribe((r) => (name = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue('sku1');
      component.inlineProductForm.get('productName')!.setValue('produto 2');

      // Assert
      expect(sku.find((p) => p.id === 'p3')).toBeUndefined();
      expect(name.find((p) => p.id === 'p3')).toBeUndefined();
    });

    it('should flag disabled only when filterOutOfStock is true and stock is zero or less', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = true;
      component.ngOnInit();

      let sku: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue('sku');

      // Assert
      expect(sku.find((p) => p.id === 'p5')).toMatchObject({ disabled: true });
      expect(sku.find((p) => p.id === 'p1')).toMatchObject({ disabled: false });
    });

    it('should never disable options when filterOutOfStock is false', () => {
      // Arrange
      const component = createComponent();
      component.filterOutOfStock = false;
      component.ngOnInit();

      let sku: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue('sku');

      // Assert
      expect(sku.find((p) => p.id === 'p5')).toMatchObject({ disabled: false });
    });

    it('should treat missing items as not already used', () => {
      // Arrange
      const component = createComponent();
      component.items = null;
      component.ngOnInit();

      let sku: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (sku = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue('sku1');

      // Assert
      expect(sku.find((p) => p.id === 'p1')).toMatchObject({ alreadyUsed: undefined });
    });
  });

  describe('setupAutoComplete', () => {
    it('should fall back to an empty array when the product response has no data', () => {
      // Arrange
      const component = createComponent();
      productServiceMock.getAll.mockReturnValue(of({} as WebApiResponse<Product[]>));
      component.ngOnInit();

      let result: Product[] = [];
      component.filteredProductsSku$.subscribe((r) => (result = r));

      // Act
      component.inlineProductForm.get('productSku')!.setValue('a');

      // Assert
      expect(result).toEqual([]);
    });
  });
});
