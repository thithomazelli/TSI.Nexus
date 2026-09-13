// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// FuelLogFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { FuelLog } from '@nexus/core';
import { FuelLogDetailsModalComponent } from './fuel-log-details-modal.component';

describe('FuelLogDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new FuelLogDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<FuelLogDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with no data/vehicleId when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.vehicleId).toBe('');
  });

  it('should derive isEdit from whether the fuel log data has an id', () => {
    // Arrange
    const fuelLog = { id: 'fl1' } as FuelLog;

    // Act
    const component = createComponent({ data: fuelLog, vehicleId: 'v1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(fuelLog);
    expect(component.vehicleId).toBe('v1');
  });

  it('should not be in edit mode when the provided data has no id', () => {
    // Act
    const component = createComponent({ data: {} as FuelLog, vehicleId: 'v1' });

    // Assert
    expect(component.isEdit).toBe(false);
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
