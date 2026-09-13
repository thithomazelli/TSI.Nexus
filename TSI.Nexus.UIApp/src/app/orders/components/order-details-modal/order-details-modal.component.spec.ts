import { MatDialogRef } from '@angular/material/dialog';
import { Order } from '@nexus/core';
import { OrderDetailsModalComponent } from './order-details-modal.component';

describe('OrderDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): OrderDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new OrderDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<OrderDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with an empty order-products list when there is no dialog data', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({ orderProducts: [] });
    expect(component.id).toBeNull();
  });

  it('should initialize from dialog data when created in edit mode', () => {
    // Arrange
    const order = { id: 'o1', orderProducts: [{ id: 'op1' }] } as unknown as Order;

    // Act
    const component = createComponent({ isEdit: true, data: order, id: 'o1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(order);
    expect(component.id).toBe('o1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({ orderProducts: [] });
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
