import { MatDialogRef } from '@angular/material/dialog';
import { OrderProduct } from '@nexus/core';
import { OrderProductsDetailsModalComponent } from './order-products-details-modal.component';

describe('OrderProductsDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): OrderProductsDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new OrderProductsDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<OrderProductsDetailsModalComponent>,
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
    const orderProduct = { id: 'op1' } as OrderProduct;
    const parentData = { id: 'o1' };

    // Act
    const component = createComponent({
      isEdit: true,
      data: orderProduct,
      id: 'op1',
      parentId: 'o1',
      parentData,
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(orderProduct);
    expect(component.id).toBe('op1');
    expect(component.parentId).toBe('o1');
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
