import { MatDialogRef } from '@angular/material/dialog';
import { Payment } from '@nexus/core';
import { PaymentDetailsModalComponent } from './payment-details-modal.component';

describe('PaymentDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): PaymentDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new PaymentDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<PaymentDetailsModalComponent>,
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
    const payment = { id: 'p1' } as Payment;
    const parentData = { id: 't1' };

    // Act
    const component = createComponent({
      isEdit: true,
      data: payment,
      id: 'p1',
      parentId: 't1',
      parentData,
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(payment);
    expect(component.id).toBe('p1');
    expect(component.parentId).toBe('t1');
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
