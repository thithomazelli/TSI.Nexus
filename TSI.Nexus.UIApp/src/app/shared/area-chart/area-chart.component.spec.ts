import { ChangeDetectorRef } from '@angular/core';
import { ApiService, TranslationService, WebApiResponse } from '@nexus/core';
import { of } from 'rxjs';
import { AreaChartComponent } from './area-chart.component';

describe('AreaChartComponent', () => {
  let apiServiceMock: { get: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const responseData = {
    incoming: [100, 200],
    outgoing: [50, 75],
    categories: ['Jan', 'Fev'],
    monthsData: [
      { full: 'Janeiro', yyyy: 2024 },
      { full: 'Fevereiro', yyyy: 2024 },
    ],
  };

  function createComponent(): AreaChartComponent {
    apiServiceMock = {
      get: vi.fn().mockReturnValue(of({ data: responseData } as unknown as WebApiResponse<any>)),
    };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new AreaChartComponent(
      apiServiceMock as unknown as ApiService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('loadChart (via ngOnInit)', () => {
    it('should build the chart series, categories and translated legend names when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.chartOptions.series).toEqual([
        { name: 'REPORTS.INCOMING', data: [100, 200] },
        { name: 'REPORTS.OUTGOING', data: [50, 75] },
      ]);
      expect(component.chartOptions.xaxis.categories).toEqual(['Jan', 'Fev']);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should reload the chart when ngOnChanges is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
    });

    describe('yaxis.labels.formatter', () => {
      it('should format a numeric value as BRL currency', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        const formatted = component.chartOptions.yaxis.labels.formatter(1234.5);

        // Assert
        expect(formatted).toContain('R$');
      });

      it('should return a non-numeric value unchanged', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        // Assert
        expect(component.chartOptions.yaxis.labels.formatter('n/a')).toBe('n/a');
      });
    });

    describe('tooltip.x.formatter', () => {
      it('should return the month name and year when the data point index is known', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        const label = component.chartOptions.tooltip.x.formatter('ignored', { dataPointIndex: 0 });

        // Assert
        expect(label).toBe('Janeiro 2024');
      });

      it('should fall back to the raw value when the data point index is negative', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        const label = component.chartOptions.tooltip.x.formatter('raw', { dataPointIndex: -1 });

        // Assert
        expect(label).toBe('raw');
      });

      it('should fall back to the raw value when there is no monthsData entry at that index', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        const label = component.chartOptions.tooltip.x.formatter('raw', { dataPointIndex: 99 });

        // Assert
        expect(label).toBe('raw');
      });
    });

    describe('tooltip.y.formatter', () => {
      it('should format a numeric value as BRL currency', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(1234.5);

        // Assert
        expect(formatted).toContain('R$');
      });

      it('should return a non-numeric value unchanged', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();

        // Act
        // Assert
        expect(component.chartOptions.tooltip.y.formatter('n/a')).toBe('n/a');
      });
    });
  });

  describe('toggleCollapse', () => {
    it('should flip isCardCollapsed each time toggleCollapse is called', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.isCardCollapsed).toBe(false);

      // Act
      component.toggleCollapse();

      // Assert
      expect(component.isCardCollapsed).toBe(true);

      // Act
      component.toggleCollapse();

      // Assert
      expect(component.isCardCollapsed).toBe(false);
    });
  });

  describe('getEndPoint (via loadChart)', () => {
    it('should use the base endpoint when no date range is set', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith('payments/GetPaymentsHistory');
    });

    it('should append only start when only startDate is set', () => {
      // Arrange
      const component = createComponent();
      component.startDate = new Date('2024-01-01T00:00:00.000Z');

      // Act
      component.ngOnInit();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `payments/GetPaymentsHistory?start=${encodeURIComponent('2024-01-01T00:00:00.000Z')}`,
      );
    });

    it('should append only end when only endDate is set', () => {
      // Arrange
      const component = createComponent();
      component.endDate = new Date('2024-01-31T00:00:00.000Z');

      // Act
      component.ngOnInit();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `payments/GetPaymentsHistory?end=${encodeURIComponent('2024-01-31T00:00:00.000Z')}`,
      );
    });

    it('should append both start and end when both dates are set', () => {
      // Arrange
      const component = createComponent();
      component.startDate = new Date('2024-01-01T00:00:00.000Z');
      component.endDate = new Date('2024-01-31T00:00:00.000Z');

      // Act
      component.ngOnInit();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `payments/GetPaymentsHistory?start=${encodeURIComponent('2024-01-01T00:00:00.000Z')}&end=${encodeURIComponent('2024-01-31T00:00:00.000Z')}`,
      );
    });
  });
});
