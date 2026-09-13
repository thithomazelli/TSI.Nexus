import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService, DashboardCard } from '@nexus/core';
import { of, throwError } from 'rxjs';
import { InfoCardsComponent } from './info-cards.component';

describe('InfoCardsComponent', () => {
  let apiServiceMock: { get: ReturnType<typeof vi.fn> };
  let sanitizerMock: { bypassSecurityTrustHtml: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let cdrMock: { detectChanges: ReturnType<typeof vi.fn>; markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): InfoCardsComponent {
    apiServiceMock = { get: vi.fn().mockReturnValue(of({ data: [] })) };
    sanitizerMock = { bypassSecurityTrustHtml: vi.fn((html: string) => html as any) };
    routerMock = { navigate: vi.fn() };
    cdrMock = { detectChanges: vi.fn(), markForCheck: vi.fn() };

    return new InfoCardsComponent(
      apiServiceMock as unknown as ApiService,
      sanitizerMock as unknown as DomSanitizer,
      routerMock as unknown as Router,
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
    it('should load the cards for the default period when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith('dashboard/getInfoCards/30');
    });
  });

  describe('onPeriodChange', () => {
    it('should reload the cards when the period actually changes', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onPeriodChange({ target: { value: '60' } } as unknown as Event);

      // Assert
      expect(component.selectedPeriod).toBe(60);
      expect(cdrMock.detectChanges).toHaveBeenCalled();
      expect(apiServiceMock.get).toHaveBeenCalledWith('dashboard/getInfoCards/60');
    });

    it('should do nothing when the period is unchanged', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onPeriodChange({ target: { value: '30' } } as unknown as Event);

      // Assert
      expect(cdrMock.detectChanges).not.toHaveBeenCalled();
      expect(apiServiceMock.get).not.toHaveBeenCalled();
    });
  });

  describe('toggleFilters', () => {
    it('should flip showFilters when toggleFilters is called', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      component.toggleFilters();
      expect(component.showFilters).toBe(true);

      component.toggleFilters();
      expect(component.showFilters).toBe(false);
    });
  });

  describe('getCardLink', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.UTC(2024, 2, 31)));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should link "Novos Pedidos" to /orders with the date range', () => {
      // Arrange
      const component = createComponent();
      component.selectedPeriod = 30;

      // Act
      const link = component.getCardLink({ title: 'Novos Pedidos' } as DashboardCard);

      // Assert
      expect(link.route).toEqual(['/orders']);
      expect(link.queryParams).toEqual({ startDate: '2024-03-01', endDate: '2024-03-31' });
    });

    it('should link "Recebidos (%)" to /payments filtered by approved incoming', () => {
      // Arrange
      const component = createComponent();

      // Act
      const link = component.getCardLink({ title: 'Recebidos (%)' } as DashboardCard);

      // Assert
      expect(link.route).toEqual(['/payments']);
      expect(link.queryParams).toEqual(
        expect.objectContaining({ status: 'Approved', type: 'Incoming' }),
      );
    });

    it('should link "Aguardando (%)" to /payments filtered by pending/delayed', () => {
      // Arrange
      const component = createComponent();

      // Act
      const link = component.getCardLink({ title: 'Aguardando (%)' } as DashboardCard);

      // Assert
      expect(link.route).toEqual(['/payments']);
      expect(link.queryParams).toEqual(expect.objectContaining({ status: 'Pending,Delayed' }));
    });

    it('should link "Em Breve" to the home route with no query params', () => {
      // Arrange
      const component = createComponent();

      // Act
      const link = component.getCardLink({ title: 'Em Breve' } as DashboardCard);

      // Assert
      expect(link.route).toEqual(['/']);
      expect(link.queryParams).toBeUndefined();
    });

    it('should fall back to the home route when the title is unknown', () => {
      // Arrange
      const component = createComponent();

      // Act
      const link = component.getCardLink({ title: 'Something Else' } as DashboardCard);

      // Assert
      expect(link.route).toEqual(['/']);
    });
  });

  describe('loadCards', () => {
    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({}));

      // Act
      component.loadCards();

      // Assert
      expect(component.cards).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should clear the cards and mark for check when the request errors', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.loadCards();

      // Assert
      expect(component.cards).toEqual([]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('trackByInfoCard', () => {
    it('should return the card title when trackByInfoCard is called', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.trackByInfoCard(0, { title: 'X' } as DashboardCard)).toBe('X');
    });
  });

  describe('getCardColor', () => {
    it('should color a "pedido" card as primary', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({ title: 'Novos Pedidos' } as DashboardCard)).toBe(
        'text-bg-primary',
      );
    });

    it.each([
      [90, 'text-bg-success'],
      [60, 'text-bg-warning'],
      [10, 'text-bg-danger'],
    ])('should color a "recebido" card as %s when the percentage is %i%%', (percent, expected) => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(
        component.getCardColor({ title: 'Recebidos (%)', value: `${percent}%` } as DashboardCard),
      ).toBe(expected);
    });

    it('should color an "aguardando" card as warning', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({ title: 'Aguardando (%)' } as DashboardCard)).toBe(
        'text-bg-warning',
      );
    });

    it('should color an "atraso" card as success when zero and as danger when non-zero', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({ title: 'Em Atraso', value: '0' } as DashboardCard)).toBe(
        'text-bg-success',
      );
      expect(component.getCardColor({ title: 'Em Atraso', value: '3' } as DashboardCard)).toBe(
        'text-bg-danger',
      );
    });

    it('should treat a missing value as zero for a "recebido" card', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({ title: 'Recebidos (%)' } as DashboardCard)).toBe(
        'text-bg-danger',
      );
    });

    it('should treat a missing value as zero (success) for an "atraso" card', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({ title: 'Em Atraso' } as DashboardCard)).toBe(
        'text-bg-success',
      );
    });

    it('should fall back to primary when the title is unrecognized', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({ title: 'Outro' } as DashboardCard)).toBe('text-bg-primary');
    });

    it('should treat a missing title/value as empty when computing the color', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.getCardColor({} as DashboardCard)).toBe('text-bg-primary');
    });
  });

  describe('getCardIcon', () => {
    it('should resolve a known icon when the title matches exactly', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.getCardIcon({ title: 'Novos Pedidos' } as DashboardCard);

      // Assert
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        expect.stringContaining('<svg'),
      );
    });

    it('should fall back to a generic icon when the title is unknown', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.getCardIcon({ title: 'Unknown' } as DashboardCard);

      // Assert
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        expect.stringContaining('<circle cx="12" cy="12" r="10"/>'),
      );
    });

    it('should treat a missing title as empty when resolving the icon', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.getCardIcon({} as DashboardCard)).not.toThrow();
    });
  });

  describe('onViewDetails', () => {
    it('should navigate using the resolved card link when onViewDetails is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onViewDetails({ title: 'Em Breve' } as DashboardCard);

      // Assert
      expect(routerMock.navigate).toHaveBeenCalledWith(['/'], { queryParams: undefined });
    });
  });
});
