import { MatDialogRef } from '@angular/material/dialog';
import { Product } from '@nexus/core';
import { ProductDetailsModalComponent } from './product-details-modal.component';

describe('ProductDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): ProductDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new ProductDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<ProductDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should default to add mode with no data when there is no dialog data', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
  });

  it('should initialize from dialog data when in edit mode', () => {
    // Arrange
    const product = { id: 'p1', name: 'Item' } as Product;

    // Act
    const component = createComponent({ isEdit: true, data: product, id: 'p1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(product);
    expect(component.id).toBe('p1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
  });

  describe('close', () => {
    it('should close the dialog with no result when close is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.close();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(null);
    });
  });
});
