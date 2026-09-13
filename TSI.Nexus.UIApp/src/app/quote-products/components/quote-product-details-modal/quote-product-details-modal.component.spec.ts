import { MatDialogRef } from '@angular/material/dialog';
import { QuoteProduct } from '@nexus/core';
import { QuoteProductDetailsModalComponent } from './quote-product-details-modal.component';

describe('QuoteProductDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): QuoteProductDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new QuoteProductDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<QuoteProductDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with no data when there is no dialog data', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
    expect(component.parentId).toBeNull();
    expect(component.parentData).toBeUndefined();
  });

  it('should initialize from dialog data when in edit mode', () => {
    // Arrange
    const quoteProduct = { id: 'qp1' } as QuoteProduct;
    const parentData = { id: 'q1' };

    // Act
    const component = createComponent({
      isEdit: true,
      data: quoteProduct,
      id: 'qp1',
      parentId: 'q1',
      parentData,
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(quoteProduct);
    expect(component.id).toBe('qp1');
    expect(component.parentId).toBe('q1');
    expect(component.parentData).toBe(parentData);
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
    expect(component.parentId).toBeNull();
    expect(component.parentData).toBeNull();
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
