import { ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '@nexus/core';
import { Subject } from 'rxjs';
import { AlertBannerComponentComponent } from './alert-banner-component.component';

describe('AlertBannerComponentComponent', () => {
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): AlertBannerComponentComponent {
    language$ = new Subject();
    translationServiceMock = {
      instant: vi.fn((key: string) => key),
      language$,
    };
    cdrMock = { markForCheck: vi.fn() };

    return new AlertBannerComponentComponent(
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

  describe('ngOnInit', () => {
    it('should build the status messages and rebuild them and mark for check when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.status = 'Pending';
      component.ngOnInit();

      // Act / Assert
      expect(component.statusMessage).toBe('ALERT_BANNER.OPEN_STATUS');

      translationServiceMock.instant.mockImplementation((key: string) =>
        key === 'ALERT_BANNER.OPEN_STATUS' ? 'traduzido' : key,
      );
      language$.next('en');

      expect(component.statusMessage).toBe('traduzido');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should use the feminine wording when the entity is a transaction', () => {
      // Arrange
      const component = createComponent();
      translationServiceMock.instant.mockImplementation((key: string) =>
        key === 'TRANSACTIONS.SINGULAR' ? 'Transação' : key,
      );
      component.entity = 'Transação';
      component.status = 'Approved';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.statusMessage).toBe('ALERT_BANNER.COMPLETED_FEM');
    });

    it('should use the masculine wording for any other entity', () => {
      // Arrange
      const component = createComponent();
      translationServiceMock.instant.mockImplementation((key: string) =>
        key === 'TRANSACTIONS.SINGULAR' ? 'Transação' : key,
      );
      component.entity = 'Pedido';
      component.status = 'Approved';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.statusMessage).toBe('ALERT_BANNER.COMPLETED_MASC');
    });
  });

  describe('statusIcon', () => {
    it('should map a known status to its icon', () => {
      // Arrange
      const component = createComponent();
      component.status = 'Delayed';

      // Act / Assert
      expect(component.statusIcon).toBe('exclamation');
    });

    it('should fall back to the default icon for an unknown or missing status', () => {
      // Arrange
      const component = createComponent();
      component.status = 'SomethingUnknown';

      // Act / Assert
      expect(component.statusIcon).toBe('info');

      component.status = undefined;
      expect(component.statusIcon).toBe('info');
    });
  });

  describe('statusColor', () => {
    it('should map a known status to its color', () => {
      // Arrange
      const component = createComponent();
      component.status = 'MissingPayments';

      // Act / Assert
      expect(component.statusColor).toBe('danger');
    });

    it('should fall back to the default color for an unknown or missing status', () => {
      // Arrange
      const component = createComponent();
      component.status = 'SomethingUnknown';

      // Act / Assert
      expect(component.statusColor).toBe('secondary');

      component.status = undefined;
      expect(component.statusColor).toBe('secondary');
    });
  });

  describe('statusMessage', () => {
    it('should fall back to the raw status when there is no mapped message', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.status = 'SomethingUnknown';

      // Assert
      expect(component.statusMessage).toBe('SomethingUnknown');
    });

    it('should fall back to an empty string when there is no status at all', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.status = undefined;

      // Assert
      expect(component.statusMessage).toBe('');
    });
  });
});
