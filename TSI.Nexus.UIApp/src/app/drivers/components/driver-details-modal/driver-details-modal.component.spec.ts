// Instantiated directly (no TestBed/fixture): the component's template embeds the real
// DriverFormComponent, whose own dependency tree (ngx-mask config, reference-data services, etc.)
// gets constructed as soon as TestBed.createComponent() builds the view - dragging in dependencies
// that belong to DriverFormComponent's own spec, not this modal's. This class has no Angular DI
// beyond its constructor params, so plain `new` exercises 100% of its real logic without any of
// that.
import { Driver } from '@nexus/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DriverDetailsModalComponent } from './driver-details-modal.component';

describe('DriverDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    return new DriverDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<DriverDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with an empty driver when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
  });

  it('should populate edit state when dialogData is provided', () => {
    // Arrange
    const driver = { id: 'd1', name: 'Ana' } as Driver;

    // Act
    const component = createComponent({ isEdit: true, data: driver, id: 'd1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(driver);
    expect(component.id).toBe('d1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
  });

  it('should set the add title when ngOnInit is called while not editing', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    component.ngOnInit();

    // Assert
    expect(component.title).toBe('Adicionar Motorista');
  });

  it('should set the edit title when ngOnInit is called while editing', () => {
    // Arrange
    const component = createComponent({ isEdit: true, data: {}, id: 'd1' });

    // Act
    component.ngOnInit();

    // Assert
    expect(component.title).toBe('Editar Motorista');
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
