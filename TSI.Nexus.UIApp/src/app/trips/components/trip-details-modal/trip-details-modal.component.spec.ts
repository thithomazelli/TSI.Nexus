// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// TripFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { Trip } from '@nexus/core';
import { TripDetailsModalComponent } from './trip-details-modal.component';

describe('TripDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new TripDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<TripDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent(null)).toBeTruthy();
  });

  it('should default to add mode with an empty trip when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
  });

  it('should populate edit state when dialogData is provided', () => {
    // Arrange
    const trip = { id: 't1' } as Trip;

    // Act
    const component = createComponent({ isEdit: true, data: trip, id: 't1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(trip);
    expect(component.id).toBe('t1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
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
