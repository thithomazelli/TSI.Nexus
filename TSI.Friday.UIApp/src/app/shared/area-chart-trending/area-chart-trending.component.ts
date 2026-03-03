import { cardCollapseAnimation } from '../../core/animations/card-collapse.animation';
import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';

@Component({
  selector: 'app-area-chart-trending',
  templateUrl: './area-chart-trending.component.html',
  styleUrl: './area-chart-trending.component.scss',
  standalone: false,
  animations: [cardCollapseAnimation],
})
export class AreaChartTrendingComponent implements OnInit, OnChanges {
  @Input()
  startDate: Date | null = null;

  @Input()
  endDate: Date | null = null;

  isCardCollapsed = false;
  chartOptions: any = {};

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
      const tendenciaEntrada = this.calcTrendLine(response.data.incoming);
      const tendenciaSaida = this.calcTrendLine(response.data.outgoing);

      this.chartOptions = {
        series: [
          {
            name: 'Entrada',
            data: response.data.incoming,
            type: 'area',
            color: '#20c997',
          },
          {
            name: 'Saída',
            data: response.data.outgoing,
            type: 'area',
            color: '#af4141',
          },
          {
            name: 'Tendência Entrada',
            data: tendenciaEntrada,
            type: 'line',
            color: '#08b481',
            opacity: 1,
          },
          {
            name: 'Tendência Saída',
            data: tendenciaSaida,
            type: 'line',
            color: '#cf1b1b',
            opacity: 1,
          },
        ],
        stroke: {
          width: [4, 4, 3, 3],
          curve: 'smooth',
          dashArray: [0, 0, 6, 6],
        },
        chart: {
          height: 300,
          type: 'area',
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
        fill: {
          type: 'solid',
          opacity: [0.35, 0.35, 1, 1],
        },
        legend: { show: true },
        dataLabels: { enabled: false },
        xaxis: {
          type: 'category',
          categories: response.data.categories,
        },
        yaxis: {
          min: 0,
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

      // this.chartOptions = {
      //   series: [
      //     {
      //       name: 'Entrada',
      //       data: response.data.incoming,
      //       type: 'area',
      //       color: '#20c997',
      //     },
      //     {
      //       name: 'Saída',
      //       data: response.data.outgoing,
      //       type: 'area',
      //       color: '#af4141',
      //     },
      //     {
      //       name: 'Tendência Entrada',
      //       data: tendenciaEntrada,
      //       type: 'line',
      //       color: '#0a7e5b',
      //       opacity: 1,
      //     },
      //     {
      //       name: 'Tendência Saída',
      //       data: tendenciaSaida,
      //       type: 'line',
      //       color: '#b11f1f',
      //       opacity: 1,
      //     },
      //   ],
      //   chart: {
      //     height: 300,
      //     type: 'line',
      //     toolbar: {
      //       show: true,
      //       tools: {
      //         download: true,
      //         selection: false,
      //         zoom: false,
      //         zoomin: true,
      //         zoomout: true,
      //         pan: true,
      //         reset: true,
      //         customIcons: [],
      //       },
      //     },
      //     zoom: {
      //       enabled: true,
      //       type: 'x',
      //       autoScaleYaxis: true,
      //     },
      //   },
      //   stroke: {
      //     curve: 'smooth',
      //   },
      //   fill: {
      //     type: 'solid',
      //     opacity: [0.35, 1],
      //   },
      //   legend: { show: true },
      //   dataLabels: { enabled: false },
      //   xaxis: {
      //     type: 'category',
      //     categories: response.data.categories,
      //   },
      //   yaxis: {
      //     min: 0,
      //     labels: {
      //       formatter: function (val: number) {
      //         if (typeof val === 'number') {
      //           return val.toLocaleString('pt-BR', {
      //             style: 'currency',
      //             currency: 'BRL',
      //             minimumFractionDigits: 2,
      //           });
      //         }
      //         return val;
      //       },
      //     },
      //   },
      //   tooltip: {
      //     x: {
      //       show: true,
      //       formatter: function (value: any, opts: any) {
      //         const idx = opts.dataPointIndex;
      //         if (idx >= 0 && response.data.monthsData[idx]) {
      //           const m = response.data.monthsData[idx];
      //           return `${m.full} ${m.yyyy}`;
      //         }
      //         return value;
      //       },
      //     },
      //     y: {
      //       formatter: function (val: number) {
      //         if (typeof val === 'number') {
      //           return val.toLocaleString('pt-BR', {
      //             style: 'currency',
      //             currency: 'BRL',
      //           });
      //         }
      //         return val;
      //       },
      //     },
      //   },
      // };
    });
  }

  toggleCollapse() {
    this.isCardCollapsed = !this.isCardCollapsed;
  }

  private calcTrendLine(data: number[]): number[] {
    const n = data.length;
    const xSum = (n * (n - 1)) / 2;
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;
    let ySum = 0,
      xySum = 0;
    for (let i = 0; i < n; i++) {
      ySum += data[i];
      xySum += i * data[i];
    }
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    return Array.from({ length: n }, (_, i) => slope * i + intercept);
  }

  private getEndPoint(): string {
    let url = `${ApiType.Payment}/GetPaymentsHistory`;
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

// import { Component, Input, ViewChild } from '@angular/core';

// import {
//   ChartComponent,
//   ApexAxisChartSeries,
//   ApexChart,
//   ApexFill,
//   ApexStroke,
//   ApexYAxis,
//   ApexTooltip,
//   ApexMarkers,
//   ApexXAxis,
// } from 'ng-apexcharts';

// @Component({
//   selector: 'app-area-chart-trending',
//   templateUrl: './area-chart-trending.component.html',
//   styleUrl: './area-chart-trending.component.scss',
//   standalone: false,
// })
// export class AreaChartTrendingComponent {
//   @ViewChild('chart') chart: ChartComponent = null as any;

//   @Input()
//   startDate: Date | null = null;

//   @Input()
//   endDate: Date | null = null;

//   public chartOptions: any;

//   constructor() {
//     this.chartOptions = {
//       series: [
//         {
//           name: 'TEAM A',
//           type: 'area',
//           data: [44, 55, 31, 47, 31, 43, 26, 41, 31, 47, 33],
//         },
//         {
//           name: 'TEAM B',
//           type: 'line',
//           data: [55, 69, 45, 61, 43, 54, 37, 52, 44, 61, 43],
//         },
//       ],
//       chart: {
//         height: 350,
//         type: 'line',
//       },
//       stroke: {
//         curve: 'smooth',
//       },
//       fill: {
//         type: 'solid',
//         opacity: [0.35, 1],
//       },
//       labels: [
//         'Dec 01',
//         'Dec 02',
//         'Dec 03',
//         'Dec 04',
//         'Dec 05',
//         'Dec 06',
//         'Dec 07',
//         'Dec 08',
//         'Dec 09 ',
//         'Dec 10',
//         'Dec 11',
//       ],
//       markers: {
//         size: 0,
//       },
//       yaxis: [
//         {
//           title: {
//             text: 'Series A',
//           },
//         },
//         {
//           opposite: true,
//           title: {
//             text: 'Series B',
//           },
//         },
//       ],
//       xaxis: {
//         labels: {
//           trim: false,
//         },
//       },
//       tooltip: {
//         shared: true,
//         intersect: false,
//         y: {
//           formatter: function (y: any) {
//             if (typeof y !== 'undefined') {
//               return y.toFixed(0) + ' points';
//             }
//             return y;
//           },
//         },
//       },
//     };
//   }

//   public generateData(count: any, yrange: { min: number; max: number }) {
//     var i = 0;
//     var series = [];
//     while (i < count) {
//       var x = 'w' + (i + 1).toString();
//       var y =
//         Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

//       series.push({
//         x: x,
//         y: y,
//       });
//       i++;
//     }
//     return series;
//   }
// }
