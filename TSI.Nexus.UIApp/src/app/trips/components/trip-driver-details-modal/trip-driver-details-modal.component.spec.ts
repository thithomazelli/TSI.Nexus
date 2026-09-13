// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// TripDriverFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { TripDriver } from '@nexus/core';
import { TripDriverDetailsModalComponent } from './trip-driver-details-modal.component';

describe('TripDriverDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new TripDriverDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<TripDriverDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default every field to null/false when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
    expect(component.parentId).toBeNull();
    expect(component.parentData).toBeUndefined();
  });

  it('should populate edit state and parent linkage from dialogData', () => {
    // Arrange
    const tripDriver = { id: 'td1' } as TripDriver;
    const parentData = { id: 'trip1' };

    // Act
    const component = createComponent({
      isEdit: true,
      data: tripDriver,
      id: 'td1',
      parentId: 'trip1',
      parentData,
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(tripDriver);
    expect(component.id).toBe('td1');
    expect(component.parentId).toBe('trip1');
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

  it('should close the dialog with null when close is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    component.close();

    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
