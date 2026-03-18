import { cardCollapseAnimation } from '../../core/animations/card-collapse.animation';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';

@Component({
  selector: 'app-area-chart',
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.scss',
  standalone: false,
  animations: [cardCollapseAnimation],
})
export class AreaChartComponent implements OnInit, OnChanges {
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
      this.chartOptions = {
        series: [
          {
            name: 'Entrada',
            data: response.data.incoming,
          },
          {
            name: 'Saída',
            data: response.data.outgoing,
          },
        ],
        chart: {
          type: 'area',
          height: 300,
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
          zoom: {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true,
          },
        },
        legend: { show: false },
        colors: ['#20c997', '#af4141'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: {
          type: 'category',
          categories: response.data.categories,
        },
        yaxis: {
          labels: {
            formatter: function (val: number) {
              if (typeof val === 'number') {
                return val.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                });
              }
              return val;
            },
          },
        },
        tooltip: {
          x: {
            show: true,
            formatter: function (value: any, opts: any) {
              const idx = opts.dataPointIndex;
              if (idx >= 0 && response.data.monthsData[idx]) {
                const m = response.data.monthsData[idx];
                return `${m.full} ${m.yyyy}`;
              }
              return value;
            },
          },
          y: {
            formatter: function (val: number) {
              if (typeof val === 'number') {
                return val.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                });
              }
              return val;
            },
          },
        },
      };
    });
  }

  toggleCollapse() {
    this.isCardCollapsed = !this.isCardCollapsed;
  }

  private getEndPoint(): string {
    let url = `${ApiType.Payments}/GetPaymentsHistory`;
    const endPoint: string[] = [];

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
