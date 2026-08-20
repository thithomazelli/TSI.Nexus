import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { cardCollapseAnimation } from '../../core/animations/card-collapse.animation';
import { ApiService, ApiType, PaymentType, WebApiResponse } from '@friday/core';
import { NgClass, NgIf } from '@angular/common';
import { ChartComponent } from 'ng-apexcharts';

@Component({
    selector: 'app-pie-chart',
    templateUrl: './pie-chart.component.html',
    styleUrl: './pie-chart.component.scss',
    animations: [cardCollapseAnimation],
    imports: [
        NgClass,
        NgIf,
        ChartComponent,
    ],
})
export class PieChartComponent implements OnInit, OnChanges {
  @Input()
  title: string = '';

  @Input()
  titleLayout: string = '';

  @Input()
  iconLayout: string = '';

  @Input()
  paymentType?: PaymentType | null = null;

  @Input()
  startDate: Date | null = null;

  @Input()
  endDate: Date | null = null;

  isCardCollapsed = false;

  chartOptions: any;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadChart();
  }

  ngOnChanges(): void {
    this.loadChart();
  }

  loadChart() {
    const endPoint = this.getEndPoint();

    this.apiService.get<WebApiResponse<any>>(endPoint).subscribe((response) => {
      const payload = response.data ?? {};

      // transforma em array de [category, total]
      const entries = Object.entries(payload);

      // montar labels e dados
      const labels = entries.map(([category]) =>
        category && category.trim() ? category : 'Sem categoria',
      );
      const data = entries.map(([, total]) => Number(total ?? 0));

      this.chartOptions = {
        series: data,
        chart: {
          type: 'donut',
          height: 320,
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true,
              customIcons: [],
            },
          },
        },
        labels: labels,
        fill: {
          type: 'gradient',
        },
        legend: {
          show: true,
          position: 'right',
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          },
        },
        tooltip: {
          y: {
            formatter: function (val: number, opts: any) {
              let realValue = val;
              let label = '';
              if (
                opts &&
                opts.w &&
                opts.w.config &&
                typeof opts.dataPointIndex === 'number'
              ) {
                const seriesArr = opts.w.config.series;
                const labelsArr = opts.w.config.labels;
                if (Array.isArray(seriesArr)) {
                  realValue = seriesArr[opts.dataPointIndex];
                }
                if (Array.isArray(labelsArr)) {
                  label = labelsArr[opts.dataPointIndex] || '';
                }
              }
              return `${label}${realValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}`;
            },
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: 'bottom',
              },
            },
          },
        ],
      };
    });
  }

  toggleCollapse() {
    this.isCardCollapsed = !this.isCardCollapsed;
  }

  private getEndPoint(): string {
    let url = `${ApiType.Payments}/GetPaymentsGroupByCategory`;
    const endPoint: string[] = [];

    if (this.paymentType) {
      endPoint.push(`type=${encodeURIComponent(this.paymentType)}`);
    }

    if (this.startDate) {
      endPoint.push(
        `start=${encodeURIComponent(this.startDate.toISOString())}`,
      );
    }

    if (this.endDate) {
      endPoint.push(`end=${encodeURIComponent(this.endDate.toISOString())}`);
    }

    if (endPoint.length) {
      url += `?${endPoint.join('&')}`;
    }

    return url;
  }
}
