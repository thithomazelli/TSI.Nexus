import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  AlertConfig,
  AlertConfigService,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { AlertConfigsComponent } from './alert-configs.component';

describe('AlertConfigsComponent', () => {
  let alertConfigServiceMock: {
    getAll: ReturnType<typeof vi.fn>;
    setEnabled: ReturnType<typeof vi.fn>;
    setThresholdDays: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent() {
    alertConfigServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: [] })),
      setEnabled: vi.fn(),
      setThresholdDays: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new AlertConfigsComponent(
      alertConfigServiceMock as unknown as AlertConfigService,
      notificationServiceMock as unknown as NotificationService,
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

  it('should load all alert configs and mark for check when ngOnInit is called', () => {
    // Arrange
    const alerts = [{ key: 'a1' }] as AlertConfig[];
    const component = createComponent();
    alertConfigServiceMock.getAll.mockReturnValue(of({ data: alerts }));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.alerts).toBe(alerts);
    expect(component.loading).toBe(false);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  it('should default to an empty list and stop loading when the response has no data', () => {
    // Arrange
    const component = createComponent();
    alertConfigServiceMock.getAll.mockReturnValue(of({ data: null }));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.alerts).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('should stop loading and mark for check when the load request errors out', () => {
    // Arrange
    const component = createComponent();
    alertConfigServiceMock.getAll.mockReturnValue(throwError(() => new Error('boom')));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.loading).toBe(false);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  describe('toggle', () => {
    it('should do nothing when the alert has no key', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.toggle({ key: '' } as AlertConfig);

      // Assert
      expect(alertConfigServiceMock.setEnabled).not.toHaveBeenCalled();
    });

    it('should do nothing while another save is already in flight', () => {
      // Arrange
      const component = createComponent();
      component.savingKey = 'other';

      // Act
      component.toggle({ key: 'a1', enabled: false } as AlertConfig);

      // Assert
      expect(alertConfigServiceMock.setEnabled).not.toHaveBeenCalled();
    });

    it('should flip enabled, call the service, apply the confirmed value, and mark for check when the request succeeds', () => {
      // Arrange
      const alert = { key: 'a1', enabled: false } as AlertConfig;
      const response = { status: ResponseStatus.Success, message: 'ok', data: { enabled: true } };
      const component = createComponent();
      alertConfigServiceMock.setEnabled.mockReturnValue(of(response));

      // Act
      component.toggle(alert);

      // Assert
      expect(alertConfigServiceMock.setEnabled).toHaveBeenCalledWith('a1', true);
      expect(alert.enabled).toBe(true);
      expect(component.savingKey).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        response.status,
        response.message,
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not apply the response value when the backend reports a non-success status', () => {
      // Arrange
      const alert = { key: 'a1', enabled: false } as AlertConfig;
      const response = { status: ResponseStatus.Error, message: 'falhou', data: { enabled: true } };
      const component = createComponent();
      alertConfigServiceMock.setEnabled.mockReturnValue(of(response));

      // Act
      component.toggle(alert);

      // Assert
      expect(alert.enabled).toBe(false);
    });

    it('should show a translated error notification, clear savingKey, and mark for check when the request errors out', () => {
      // Arrange
      const alert = { key: 'a1', enabled: false } as AlertConfig;
      const component = createComponent();
      alertConfigServiceMock.setEnabled.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.toggle(alert);

      // Assert
      expect(component.savingKey).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'ALERT_CONFIGS.UPDATE_ERROR',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('saveThreshold', () => {
    it('should do nothing when the alert has no key', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.saveThreshold({ key: '', thresholdDays: 5 } as AlertConfig);

      // Assert
      expect(alertConfigServiceMock.setThresholdDays).not.toHaveBeenCalled();
    });

    it('should do nothing when thresholdDays is missing or below 1', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.saveThreshold({ key: 'a1', thresholdDays: null } as unknown as AlertConfig);
      component.saveThreshold({ key: 'a1', thresholdDays: 0 } as AlertConfig);

      // Assert
      expect(alertConfigServiceMock.setThresholdDays).not.toHaveBeenCalled();
    });

    it('should do nothing while another save is already in flight', () => {
      // Arrange
      const component = createComponent();
      component.savingKey = 'other';

      // Act
      component.saveThreshold({ key: 'a1', thresholdDays: 5 } as AlertConfig);

      // Assert
      expect(alertConfigServiceMock.setThresholdDays).not.toHaveBeenCalled();
    });

    it('should save the threshold, apply the confirmed value, and mark for check when the request succeeds', () => {
      // Arrange
      const alert = { key: 'a1', thresholdDays: 5 } as AlertConfig;
      const response = {
        status: ResponseStatus.Success,
        message: 'ok',
        data: { thresholdDays: 7 },
      };
      const component = createComponent();
      alertConfigServiceMock.setThresholdDays.mockReturnValue(of(response));

      // Act
      component.saveThreshold(alert);

      // Assert
      expect(alertConfigServiceMock.setThresholdDays).toHaveBeenCalledWith('a1', 5);
      expect(alert.thresholdDays).toBe(7);
      expect(component.savingKey).toBeNull();
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should show a translated error notification and mark for check when the request errors out', () => {
      // Arrange
      const alert = { key: 'a1', thresholdDays: 5 } as AlertConfig;
      const component = createComponent();
      alertConfigServiceMock.setThresholdDays.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.saveThreshold(alert);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'ALERT_CONFIGS.UPDATE_THRESHOLD_ERROR',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not apply the response value when the backend reports a non-success status', () => {
      // Arrange
      const alert = { key: 'a1', thresholdDays: 5 } as AlertConfig;
      const response = {
        status: ResponseStatus.Error,
        message: 'falhou',
        data: { thresholdDays: 7 },
      };
      const component = createComponent();
      alertConfigServiceMock.setThresholdDays.mockReturnValue(of(response));

      // Act
      component.saveThreshold(alert);

      // Assert
      expect(alert.thresholdDays).toBe(5);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        response.status,
        response.message,
      );
    });
  });
});
