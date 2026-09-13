// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// PurchaseOrderFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { PurchaseOrder } from '@nexus/core';
import { PurchaseOrderDetailsModalComponent } from './purchase-order-details-modal.component';

describe('PurchaseOrderDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new PurchaseOrderDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<PurchaseOrderDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with an empty purchase order when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({ purchaseOrderProducts: [] });
    expect(component.id).toBeNull();
    expect(component.preselectedProductId).toBeNull();
  });

  it('should populate edit state and preselectedProductId when dialogData is provided', () => {
    // Arrange
    const order = { id: 'po1', purchaseOrderProducts: [] } as PurchaseOrder;

    // Act
    const component = createComponent({
      isEdit: true,
      data: order,
      id: 'po1',
      preselectedProductId: 'prod-1',
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(order);
    expect(component.id).toBe('po1');
    expect(component.preselectedProductId).toBe('prod-1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({ purchaseOrderProducts: [] });
    expect(component.id).toBeNull();
    expect(component.preselectedProductId).toBeNull();
  });

  it('should close the dialog with null when close() is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    component.close();

    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
