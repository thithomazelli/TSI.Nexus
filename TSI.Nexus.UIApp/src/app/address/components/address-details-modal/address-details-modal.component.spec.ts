import { MatDialogRef } from '@angular/material/dialog';
import { Address } from '@nexus/core';
import { AddressDetailsModalComponent } from './address-details-modal.component';

describe('AddressDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): AddressDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new AddressDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<AddressDetailsModalComponent>,
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
  });

  it('should initialize from dialog data when in edit mode', () => {
    // Arrange
    const address = { id: 'a1', street: 'Rua A' } as Address;

    // Act
    const component = createComponent({
      isEdit: true,
      data: address,
      id: 'a1',
      parentId: 'bp1',
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(address);
    expect(component.id).toBe('a1');
    expect(component.parentId).toBe('bp1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
    expect(component.parentId).toBeNull();
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
