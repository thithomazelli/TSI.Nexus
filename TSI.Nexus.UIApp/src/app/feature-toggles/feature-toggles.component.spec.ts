import { of, throwError } from 'rxjs';
import { FeatureFlagService, FeatureToggle, NotificationService, ResponseStatus, TranslationService } from '@nexus/core';
import { FeatureTogglesComponent } from './feature-toggles.component';

describe('FeatureTogglesComponent', () => {
  let featureFlagServiceMock: { getAll: ReturnType<typeof vi.fn>; setEnabled: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent() {
    featureFlagServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: [] })), setEnabled: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new FeatureTogglesComponent(
      featureFlagServiceMock as unknown as FeatureFlagService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should load all toggles when ngOnInit is called', () => {
    // Arrange
    const toggles = [{ key: 'FleetModule' }] as FeatureToggle[];
    const component = createComponent();
    featureFlagServiceMock.getAll.mockReturnValue(of({ data: toggles }));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.toggles).toBe(toggles);
    expect(component.loading).toBe(false);
  });

  it('should default to an empty list when the response has no data', () => {
    // Arrange
    const component = createComponent();
    featureFlagServiceMock.getAll.mockReturnValue(of({}));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.toggles).toEqual([]);
  });

  it('should stop loading when the load request errors out', () => {
    // Arrange
    const component = createComponent();
    featureFlagServiceMock.getAll.mockReturnValue(throwError(() => new Error('boom')));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.loading).toBe(false);
  });

  describe('groupToggles / detailedGroups', () => {
    it('should return only the top-level toggles when accessing groupToggles', () => {
      // Arrange
      const component = createComponent();
      component.toggles = [
        { key: 'FleetModule' } as FeatureToggle,
        { key: 'Vehicles', groupKey: 'FleetModule' } as FeatureToggle,
        { key: 'FinanceModule' } as FeatureToggle,
      ];

      // Act
      // Assert
      expect(component.groupToggles.map((t) => t.key)).toEqual(['FleetModule', 'FinanceModule']);
    });

    it('should nest each group with only its own entity toggles when accessing detailedGroups', () => {
      // Arrange
      const component = createComponent();
      const fleetGroup = { key: 'FleetModule' } as FeatureToggle;
      const financeGroup = { key: 'FinanceModule' } as FeatureToggle;
      const vehicles = { key: 'Vehicles', groupKey: 'FleetModule' } as FeatureToggle;
      const drivers = { key: 'Drivers', groupKey: 'FleetModule' } as FeatureToggle;
      component.toggles = [fleetGroup, financeGroup, vehicles, drivers];

      // Act
      const groups = component.detailedGroups;

      // Assert
      expect(groups).toHaveLength(1);
      expect(groups[0].group).toBe(fleetGroup);
      expect(groups[0].entities).toEqual([vehicles, drivers]);
    });

    it('should omit a group from detailedGroups when it has no entity toggles', () => {
      // Arrange
      const component = createComponent();
      component.toggles = [{ key: 'FleetModule' } as FeatureToggle];

      // Act
      // Assert
      expect(component.detailedGroups).toEqual([]);
    });
  });

  describe('trackBy helpers', () => {
    it('should return the nested group key when trackByGroupKey is called', () => {
      // Arrange
      const component = createComponent();
      const groupView = { group: { key: 'FleetModule' } as FeatureToggle, entities: [] };

      // Act
      // Assert
      expect(component.trackByGroupKey(0, groupView)).toBe('FleetModule');
    });

    it('should return the toggle key when trackByToggleKey is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.trackByToggleKey(0, { key: 'Vehicles' } as FeatureToggle)).toBe('Vehicles');
    });
  });

  describe('toggle', () => {
    it('should do nothing when the toggle has no key', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.toggle({ key: '' } as FeatureToggle);

      // Assert
      expect(featureFlagServiceMock.setEnabled).not.toHaveBeenCalled();
    });

    it('should do nothing when another save is already in flight', () => {
      // Arrange
      const component = createComponent();
      component.savingKey = 'other';

      // Act
      component.toggle({ key: 'FleetModule', enabled: false } as FeatureToggle);

      // Assert
      expect(featureFlagServiceMock.setEnabled).not.toHaveBeenCalled();
    });

    it('should flip enabled, call the service, and apply the confirmed value when the update succeeds', () => {
      // Arrange
      const toggle = { key: 'FleetModule', enabled: false } as FeatureToggle;
      const response = { status: ResponseStatus.Success, message: 'ok', data: { enabled: true } };
      const component = createComponent();
      featureFlagServiceMock.setEnabled.mockReturnValue(of(response));

      // Act
      component.toggle(toggle);

      // Assert
      expect(featureFlagServiceMock.setEnabled).toHaveBeenCalledWith('FleetModule', true);
      expect(toggle.enabled).toBe(true);
      expect(component.savingKey).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(response.status, response.message);
    });

    it('should not apply the response value when the backend reports a non-success status', () => {
      // Arrange
      const toggle = { key: 'FleetModule', enabled: false } as FeatureToggle;
      const response = { status: ResponseStatus.Error, message: 'falhou', data: { enabled: true } };
      const component = createComponent();
      featureFlagServiceMock.setEnabled.mockReturnValue(of(response));

      // Act
      component.toggle(toggle);

      // Assert
      expect(toggle.enabled).toBe(false);
    });

    it('should show a translated error notification and clear savingKey when the request errors out', () => {
      // Arrange
      const toggle = { key: 'FleetModule', enabled: false } as FeatureToggle;
      const component = createComponent();
      featureFlagServiceMock.setEnabled.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.toggle(toggle);

      // Assert
      expect(component.savingKey).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'FEATURE_TOGGLES.UPDATE_ERROR');
    });
  });
});
