// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// PurchaseOrderProductsFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { PurchaseOrderProduct } from '@nexus/core';
import { PurchaseOrderProductsDetailsModalComponent } from './purchase-order-products-details-modal.component';

describe('PurchaseOrderProductsDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new PurchaseOrderProductsDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<PurchaseOrderProductsDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default every field to null or false when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
    expect(component.parentId).toBeNull();
    expect(component.parentData).toBeUndefined();
  });

  it('should populate edit state and parent linkage when dialogData is provided', () => {
    // Arrange
    const product = { id: 'p1' } as PurchaseOrderProduct;
    const parentData = { id: 'po1' };

    // Act
    const component = createComponent({
      isEdit: true,
      data: product,
      id: 'p1',
      parentId: 'po1',
      parentData,
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(product);
    expect(component.id).toBe('p1');
    expect(component.parentId).toBe('po1');
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

  it('should close the dialog with null when close() is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    component.close();

    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
