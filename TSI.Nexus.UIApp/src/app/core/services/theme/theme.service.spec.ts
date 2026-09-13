import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
    TestBed.configureTestingModule({});
  });

  function createService(): ThemeService {
    return TestBed.inject(ThemeService);
  }

  it('should create the service when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  it('should default to light when nothing is stored', () => {
    // Act
    const service = createService();

    // Assert
    expect(service.current).toBe('light');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('should read the stored theme when constructed', () => {
    // Arrange
    localStorage.setItem('app-theme', 'dark');

    // Act
    const service = createService();

    // Assert
    expect(service.current).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should fall back to light when the stored value is invalid', () => {
    // Arrange
    localStorage.setItem('app-theme', 'purple');

    // Act
    const service = createService();

    // Assert
    expect(service.current).toBe('light');
  });

  it('should set the DOM attribute, persist to localStorage, and update current and theme$ when apply is called', () => {
    // Arrange
    const service = createService();
    let latest: string | undefined;
    service.theme$.subscribe((t) => (latest = t));
    TestBed.flushEffects();

    // Act
    service.apply('dark');
    TestBed.flushEffects();

    // Assert
    expect(service.current).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(localStorage.getItem('app-theme')).toBe('dark');
    expect(latest).toBe('dark');
  });

  it('should flip between light and dark and return the new value when toggle is called', () => {
    // Arrange
    const service = createService();

    // Act
    // Assert
    expect(service.current).toBe('light');
    expect(service.toggle()).toBe('dark');
    expect(service.current).toBe('dark');
    expect(service.toggle()).toBe('light');
    expect(service.current).toBe('light');
  });
});
