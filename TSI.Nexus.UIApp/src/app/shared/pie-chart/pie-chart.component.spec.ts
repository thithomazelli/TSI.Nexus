import { ChangeDetectorRef } from '@angular/core';
import { ApiService, ApiType, PaymentType } from '@nexus/core';
import { of } from 'rxjs';
import { PieChartComponent } from './pie-chart.component';

describe('PieChartComponent', () => {
  let apiServiceMock: { get: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): PieChartComponent {
    apiServiceMock = { get: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };

    return new PieChartComponent(
      apiServiceMock as unknown as ApiService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit / ngOnChanges', () => {
    it('should load the chart when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({ data: { Combustível: 100 } }));

      // Act
      component.ngOnInit();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalled();
      expect(component.chartOptions.series).toEqual([100]);
    });

    it('should reload the chart when ngOnChanges is called', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.ngOnChanges();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalled();
    });
  });

  describe('loadChart', () => {
    it('should build the series and labels from the response categories', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(
        of({ data: { Combustível: 100, Manutenção: 50 } }),
      );

      // Act
      component.loadChart();

      // Assert
      expect(component.chartOptions.series).toEqual([100, 50]);
      expect(component.chartOptions.labels).toEqual(['Combustível', 'Manutenção']);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should fall back to an empty payload when the response has no data', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({}));

      // Act
      component.loadChart();

      // Assert
      expect(component.chartOptions.series).toEqual([]);
      expect(component.chartOptions.labels).toEqual([]);
    });

    it('should label a blank category as "Sem categoria"', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({ data: { '': 10, '   ': 20 } }));

      // Act
      component.loadChart();

      // Assert
      expect(component.chartOptions.labels).toEqual(['Sem categoria', 'Sem categoria']);
    });

    it('should treat a missing or null total as zero', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({ data: { Combustível: null } }));

      // Act
      component.loadChart();

      // Assert
      expect(component.chartOptions.series).toEqual([0]);
    });

    it('should format the dataLabels formatter output as a percentage', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.loadChart();

      // Assert
      expect(component.chartOptions.dataLabels.formatter(12.345)).toBe('12.3%');
    });

    describe('tooltip.y.formatter', () => {
      it('should resolve the real value and label from the series/labels config at the data point index', () => {
        // Arrange
        const component = createComponent();
        apiServiceMock.get.mockReturnValue(of({ data: {} }));
        component.loadChart();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(0, {
          w: { config: { series: [250], labels: ['Combustível'] } },
          dataPointIndex: 0,
        });

        // Assert
        expect(formatted).toContain('Combustível');
        expect(formatted).toContain('250,00');
      });

      it('should fall back to an empty label when the labels config is not an array', () => {
        // Arrange
        const component = createComponent();
        apiServiceMock.get.mockReturnValue(of({ data: {} }));
        component.loadChart();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(250, {
          w: { config: { series: [250], labels: undefined } },
          dataPointIndex: 0,
        });

        // Assert
        expect(formatted).toContain('250,00');
      });

      it('should fall back to an empty label when the labels array has no entry at the index', () => {
        // Arrange
        const component = createComponent();
        apiServiceMock.get.mockReturnValue(of({ data: {} }));
        component.loadChart();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(250, {
          w: { config: { series: [250], labels: [] } },
          dataPointIndex: 0,
        });

        // Assert
        expect(formatted).not.toMatch(/^undefined/);
        expect(formatted).toContain('250,00');
      });

      it('should use the raw value when opts/config is missing', () => {
        // Arrange
        const component = createComponent();
        apiServiceMock.get.mockReturnValue(of({ data: {} }));
        component.loadChart();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(99, undefined);

        // Assert
        expect(formatted).toContain('99,00');
      });

      it('should use the raw value when dataPointIndex is not a number', () => {
        // Arrange
        const component = createComponent();
        apiServiceMock.get.mockReturnValue(of({ data: {} }));
        component.loadChart();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(42, {
          w: { config: { series: [1, 2, 3], labels: ['a', 'b', 'c'] } },
          dataPointIndex: 'x',
        });

        // Assert
        expect(formatted).toContain('42,00');
      });

      it('should fall back to a raw value when the series config is not an array', () => {
        // Arrange
        const component = createComponent();
        apiServiceMock.get.mockReturnValue(of({ data: {} }));
        component.loadChart();

        // Act
        const formatted = component.chartOptions.tooltip.y.formatter(77, {
          w: { config: { series: undefined, labels: ['a'] } },
          dataPointIndex: 0,
        });

        // Assert
        expect(formatted).toContain('77,00');
      });
    });
  });

  describe('toggleCollapse', () => {
    it('should flip isCardCollapsed each time it is called', () => {
      // Arrange
      const component = createComponent();

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
    it('should request the base category endpoint when there is no filter', () => {
      // Arrange
      const component = createComponent();
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.loadChart();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `${ApiType.Payments}/GetPaymentsGroupByCategory`,
      );
    });

    it('should append only the payment type when just paymentType is set', () => {
      // Arrange
      const component = createComponent();
      component.paymentType = PaymentType.Incoming;
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.loadChart();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `${ApiType.Payments}/GetPaymentsGroupByCategory?type=${encodeURIComponent(PaymentType.Incoming)}`,
      );
    });

    it('should append only the start date when just startDate is set', () => {
      // Arrange
      const component = createComponent();
      component.startDate = new Date('2024-01-01T00:00:00.000Z');
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.loadChart();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `${ApiType.Payments}/GetPaymentsGroupByCategory?start=${encodeURIComponent('2024-01-01T00:00:00.000Z')}`,
      );
    });

    it('should append only the end date when just endDate is set', () => {
      // Arrange
      const component = createComponent();
      component.endDate = new Date('2024-01-31T00:00:00.000Z');
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.loadChart();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `${ApiType.Payments}/GetPaymentsGroupByCategory?end=${encodeURIComponent('2024-01-31T00:00:00.000Z')}`,
      );
    });

    it('should append the type and both dates when all filters are set', () => {
      // Arrange
      const component = createComponent();
      component.paymentType = PaymentType.Outgoing;
      component.startDate = new Date('2024-01-01T00:00:00.000Z');
      component.endDate = new Date('2024-01-31T00:00:00.000Z');
      apiServiceMock.get.mockReturnValue(of({ data: {} }));

      // Act
      component.loadChart();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith(
        `${ApiType.Payments}/GetPaymentsGroupByCategory?type=${encodeURIComponent(PaymentType.Outgoing)}&start=${encodeURIComponent('2024-01-01T00:00:00.000Z')}&end=${encodeURIComponent('2024-01-31T00:00:00.000Z')}`,
      );
    });
  });
});
