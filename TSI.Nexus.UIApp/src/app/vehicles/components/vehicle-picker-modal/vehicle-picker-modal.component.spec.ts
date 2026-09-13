import { ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TranslationService, Vehicle, VehicleService } from '@nexus/core';
import { VehiclePickerModalComponent } from './vehicle-picker-modal.component';

describe('VehiclePickerModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let vehicleServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): VehiclePickerModalComponent {
    dialogRefMock = { close: vi.fn() };
    vehicleServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: [] })) };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new VehiclePickerModalComponent(
      dialogRefMock as unknown as MatDialogRef<VehiclePickerModalComponent>,
      vehicleServiceMock as unknown as VehicleService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('statusMap', () => {
    it('should expose translated labels and colors for every known status', () => {
      // Arrange
      const component = createComponent();

      // Act
      const map = component.statusMap;

      // Assert
      expect(map['Available']).toEqual({ label: 'VEHICLES.STATUS_AVAILABLE', color: 'success' });
      expect(map['InMaintenance']).toEqual({ label: 'VEHICLES.STATUS_IN_MAINTENANCE', color: 'warning' });
      expect(map['Blocked']).toEqual({ label: 'VEHICLES.STATUS_BLOCKED', color: 'danger' });
      expect(map['Inactive']).toEqual({ label: 'VEHICLES.STATUS_INACTIVE', color: 'secondary' });
    });
  });

  describe('ngOnInit', () => {
    it('should load vehicles, apply the filter and mark for check when the request succeeds', () => {
      // Arrange
      const component = createComponent();
      const vehicles = [{ plate: 'ABC1234' } as Vehicle];
      vehicleServiceMock.getAll.mockReturnValue(of({ data: vehicles }));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual(vehicles);
      expect(component.filteredVehicles).toEqual(vehicles);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      vehicleServiceMock.getAll.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual([]);
      expect(component.filteredVehicles).toEqual([]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const destroy$ = (component as unknown as { _destroy$: { next: ReturnType<typeof vi.fn>; complete: ReturnType<typeof vi.fn> } })
        ._destroy$;
      const nextSpy = vi.spyOn(destroy$, 'next');
      const completeSpy = vi.spyOn(destroy$, 'complete');

      // Act
      component.ngOnDestroy();

      // Assert
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('applyFilter', () => {
    it('should show every vehicle when the search term is empty', () => {
      // Arrange
      const component = createComponent();
      component.vehicles = [{ plate: 'ABC1234' } as Vehicle, { plate: 'XYZ9999' } as Vehicle];
      component.searchTerm = '   ';

      // Act
      component.applyFilter();

      // Assert
      expect(component.filteredVehicles).toEqual(component.vehicles);
    });

    it('should filter by plate, brand or model case-insensitively when a search term is set', () => {
      // Arrange
      const component = createComponent();
      component.vehicles = [
        { plate: 'ABC1234', brand: 'Ford', model: 'Ka' } as Vehicle,
        { plate: 'XYZ9999', brand: 'Fiat', model: 'Uno' } as Vehicle,
      ];
      component.searchTerm = 'uno';

      // Act
      component.applyFilter();

      // Assert
      expect(component.filteredVehicles).toEqual([component.vehicles[1]]);
    });
  });

  describe('select', () => {
    it('should close the dialog with the chosen vehicle when select is called', () => {
      // Arrange
      const component = createComponent();
      const vehicle = { plate: 'ABC1234' } as Vehicle;

      // Act
      component.select(vehicle);

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(vehicle);
    });
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
