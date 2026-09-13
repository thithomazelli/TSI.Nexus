import { MatDialogRef } from '@angular/material/dialog';
import { Transaction } from '@nexus/core';
import { TransactionDetailsModalComponent } from './transaction-details-modal.component';

describe('TransactionDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): TransactionDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new TransactionDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<TransactionDetailsModalComponent>,
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
  });

  it('should initialize from dialog data when created in edit mode', () => {
    // Arrange
    const transaction = { id: 't1' } as Transaction;

    // Act
    const component = createComponent({ isEdit: true, data: transaction, id: 't1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(transaction);
    expect(component.id).toBe('t1');
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
