import { of, throwError } from 'rxjs';
import {
  NotificationService,
  PreferencesService,
  ThemeService,
  TranslationService,
} from '@nexus/core';
import { UserPreferencesComponent } from './user-preferences.component';

describe('UserPreferencesComponent', () => {
  let themeServiceMock: { current: string; apply: ReturnType<typeof vi.fn> };
  let translationServiceMock: { current: string; use: ReturnType<typeof vi.fn>; instant: ReturnType<typeof vi.fn> };
  let preferencesServiceMock: { update: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };

  function createComponent() {
    themeServiceMock = { current: 'light', apply: vi.fn() };
    translationServiceMock = { current: 'pt-BR', use: vi.fn(), instant: vi.fn((key: string) => key) };
    preferencesServiceMock = { update: vi.fn().mockReturnValue(of({})) };
    notificationServiceMock = { showMessage: vi.fn() };

    return new UserPreferencesComponent(
      themeServiceMock as unknown as ThemeService,
      translationServiceMock as unknown as TranslationService,
      preferencesServiceMock as unknown as PreferencesService,
      notificationServiceMock as unknown as NotificationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('onThemeSelect', () => {
    it('should do nothing when the selected theme is already active', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onThemeSelect('light' as never);

      // Assert
      expect(themeServiceMock.apply).not.toHaveBeenCalled();
      expect(preferencesServiceMock.update).not.toHaveBeenCalled();
    });

    it('should apply the new theme and persist the preference when a different theme is selected', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onThemeSelect('dark' as never);

      // Assert
      expect(themeServiceMock.apply).toHaveBeenCalledWith('dark');
      expect(preferencesServiceMock.update).toHaveBeenCalledWith({ theme: 'light', language: 'pt-BR' });
    });
  });

  describe('onLanguageChange', () => {
    it('should do nothing when the selected language is already active', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onLanguageChange('pt-BR' as never);

      // Assert
      expect(translationServiceMock.use).not.toHaveBeenCalled();
      expect(preferencesServiceMock.update).not.toHaveBeenCalled();
    });

    it('should switch the language and persist the preference when a different language is selected', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onLanguageChange('en' as never);

      // Assert
      expect(translationServiceMock.use).toHaveBeenCalledWith('en');
      expect(preferencesServiceMock.update).toHaveBeenCalled();
    });
  });

  describe('persist', () => {
    it('should reset saving to false when the update succeeds', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onThemeSelect('dark' as never);

      // Assert
      expect(component.saving).toBe(false);
    });

    it('should show a translated error notification and reset saving when the update fails', () => {
      // Arrange
      const component = createComponent();
      preferencesServiceMock.update.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.onThemeSelect('dark' as never);

      // Assert
      expect(component.saving).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'PREFERENCES.ERROR');
    });
  });
});
