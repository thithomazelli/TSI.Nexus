import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
    TestBed.configureTestingModule({});
  });

  function createService(): TranslationService {
    return TestBed.inject(TranslationService);
  }

  it('should create the service when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  it('should default to pt-BR when nothing is stored', () => {
    // Act
    const service = createService();

    // Assert
    expect(service.current).toBe('pt-BR');
    expect(document.documentElement.getAttribute('lang')).toBe('pt-BR');
  });

  it('should read the stored language when constructed', () => {
    // Arrange
    localStorage.setItem('app-language', 'en');

    // Act
    const service = createService();

    // Assert
    expect(service.current).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('should fall back to pt-BR when the stored value is invalid', () => {
    // Arrange
    localStorage.setItem('app-language', 'fr');

    // Act
    const service = createService();

    // Assert
    expect(service.current).toBe('pt-BR');
  });

  it('should set the DOM lang attribute, persist to localStorage, and update current/language$ when use is called', () => {
    // Arrange
    const service = createService();
    let latest: string | undefined;
    service.language$.subscribe((l) => (latest = l));
    TestBed.flushEffects();

    // Act
    service.use('es');
    TestBed.flushEffects();

    // Assert
    expect(service.current).toBe('es');
    expect(document.documentElement.getAttribute('lang')).toBe('es');
    expect(localStorage.getItem('app-language')).toBe('es');
    expect(latest).toBe('es');
  });

  describe('instant', () => {
    it('should resolve a nested key when it exists in the current language dictionary', () => {
      // Arrange
      const service = createService();

      // Act
      // Assert
      expect(service.instant('SIDEBAR.HOME')).toBe('Home');
    });

    it('should resolve from the newly selected language when use was called first', () => {
      // Arrange
      const service = createService();

      // Act
      service.use('en');

      // Assert
      expect(service.instant('APP_TITLE')).not.toBe('Nexus | Gestão Empresarial');
    });

    it('should return the key itself when it cannot be resolved', () => {
      // Arrange
      const service = createService();

      // Act
      // Assert
      expect(service.instant('NOT.A.REAL.KEY')).toBe('NOT.A.REAL.KEY');
    });

    it('should substitute placeholders from params when the key contains them', () => {
      // Arrange
      const service = createService();

      // Act
      // Assert
      expect(service.instant('{greeting}, {name}!', { greeting: 'Oi', name: 'Ana' })).toBe(
        'Oi, Ana!',
      );
    });
  });
});
