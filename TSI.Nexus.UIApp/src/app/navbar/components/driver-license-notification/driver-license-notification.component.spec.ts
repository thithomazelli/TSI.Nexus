import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { Driver, DriverService, ModalService } from '@nexus/core';
import { DriverLicenseNotificationComponent } from './driver-license-notification.component';

describe('DriverLicenseNotificationComponent', () => {
  let driverServiceMock: { getExpiringLicenses: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent() {
    driverServiceMock = { getExpiringLicenses: vi.fn().mockReturnValue(of({ data: [] })) };
    modalServiceMock = { showTemplateModal: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };
    return new DriverLicenseNotificationComponent(
      driverServiceMock as unknown as DriverService,
      modalServiceMock as unknown as ModalService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should load expiring licenses, update total/drivers and mark for check when ngOnInit is called', () => {
    // Arrange
    const drivers = [{ id: 'd1' }, { id: 'd2' }] as Driver[];
    const component = createComponent();
    driverServiceMock.getExpiringLicenses.mockReturnValue(of({ data: drivers }));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.drivers).toBe(drivers);
    expect(component.total).toBe(2);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  it('should default to an empty list when the response has no data', () => {
    // Arrange
    const component = createComponent();
    driverServiceMock.getExpiringLicenses.mockReturnValue(of({ data: null }));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.drivers).toEqual([]);
    expect(component.total).toBe(0);
  });

  it('should show the badge only when there is at least one driver', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(component.showBadge).toBe(false);

    component.total = 1;
    expect(component.showBadge).toBe(true);
  });

  it('should cap displayDrivers at 10 when there are more than 10 drivers', () => {
    // Arrange
    const component = createComponent();
    component.drivers = Array.from({ length: 15 }, (_, i) => ({ id: `d${i}` }) as Driver);

    // Act / Assert
    expect(component.displayDrivers.length).toBe(10);
  });

  it('should treat a past license expiry date as expired', () => {
    // Arrange
    const component = createComponent();
    const driver = { licenseExpiryDate: new Date(2000, 0, 1) } as Driver;

    // Act / Assert
    expect(component.isExpired(driver)).toBe(true);
  });

  it('should treat a future license expiry date as not expired', () => {
    // Arrange
    const component = createComponent();
    const driver = { licenseExpiryDate: new Date(2999, 0, 1) } as Driver;

    // Act / Assert
    expect(component.isExpired(driver)).toBe(false);
  });

  it('should open the driver details modal in edit mode when openDriver is called', () => {
    // Arrange
    const component = createComponent();
    const driver = { id: 'd1' } as Driver;

    // Act
    component.openDriver(driver);

    // Assert
    expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
      expect.anything(),
      { isEdit: true, id: 'd1', data: driver },
    );
  });
});
