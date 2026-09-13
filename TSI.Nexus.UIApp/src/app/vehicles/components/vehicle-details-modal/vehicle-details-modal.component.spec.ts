// Instantiated directly - see driver-details-modal.component.spec.ts for why: the real
// VehicleFormComponent embedded in the template drags in its own DI tree via
// TestBed.createComponent(), which belongs to that component's own spec, not this modal's.
import { MatDialogRef } from '@angular/material/dialog';
import { TranslationService, Vehicle } from '@nexus/core';
import { VehicleDetailsModalComponent } from './vehicle-details-modal.component';

describe('VehicleDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    translationServiceMock = {
      instant: vi.fn((key: string, params?: Record<string, string>) => {
        if (key === 'COMMON.ADD_ENTITY') return `Adicionar ${params?.['entity']}`;
        if (key === 'COMMON.EDIT_ENTITY') return `Editar ${params?.['entity']}`;
        if (key === 'VEHICLES.SINGULAR') return 'Veículo';
        return key;
      }),
    };
    return new VehicleDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<VehicleDetailsModalComponent>,
      dialogData,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with an empty vehicle when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
  });

  it('should populate edit state when dialogData is provided', () => {
    // Arrange
    const vehicle = { id: 'v1', plate: 'ABC1234' } as Vehicle;

    // Act
    const component = createComponent({ isEdit: true, data: vehicle, id: 'v1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(vehicle);
    expect(component.id).toBe('v1');
  });

  it('should set the translated add title when ngOnInit is called while not editing', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    component.ngOnInit();

    // Assert
    expect(component.title).toBe('Adicionar Veículo');
  });

  it('should set the translated edit title when ngOnInit is called while editing', () => {
    // Arrange
    const component = createComponent({ isEdit: true, data: {}, id: 'v1' });

    // Act
    component.ngOnInit();

    // Assert
    expect(component.title).toBe('Editar Veículo');
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
