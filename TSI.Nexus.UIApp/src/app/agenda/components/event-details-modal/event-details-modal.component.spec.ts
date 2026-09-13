// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// EventFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { AgendaEvent } from '@nexus/core';
import { EventDetailsModalComponent } from './event-details-modal.component';

describe('EventDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new EventDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<EventDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent(null)).toBeTruthy();
  });

  it('should default every field to null or false when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.prefillStart).toBeNull();
    expect(component.prefillEnd).toBeNull();
    expect(component.lockedLinkField).toBeNull();
    expect(component.lockedLinkId).toBeNull();
    expect(component.lockedLinkLabel).toBeNull();
  });

  it('should populate edit state and prefill/lock fields when dialogData is provided', () => {
    // Arrange
    const event = { id: 'e1' } as AgendaEvent;
    const prefillStart = new Date(2024, 0, 1);
    const prefillEnd = new Date(2024, 0, 2);

    // Act
    const component = createComponent({
      isEdit: true,
      data: event,
      prefillStart,
      prefillEnd,
      lockedLinkField: 'tripId',
      lockedLinkId: 't1',
      lockedLinkLabel: 'Trip 1',
    });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(event);
    expect(component.prefillStart).toBe(prefillStart);
    expect(component.prefillEnd).toBe(prefillEnd);
    expect(component.lockedLinkField).toBe('tripId');
    expect(component.lockedLinkId).toBe('t1');
    expect(component.lockedLinkLabel).toBe('Trip 1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.prefillStart).toBeNull();
    expect(component.prefillEnd).toBeNull();
    expect(component.lockedLinkField).toBeNull();
    expect(component.lockedLinkId).toBeNull();
    expect(component.lockedLinkLabel).toBeNull();
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
