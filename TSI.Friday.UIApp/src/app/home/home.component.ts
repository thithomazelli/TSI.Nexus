import { AfterViewInit, Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private charts: any[] = [];
  private mapInstance: any = null;
  private resizeUnlisten: (() => void) | null = null;
  private tipEl: HTMLElement | null = null;
  private tipMousemoveUnlisten: (() => void) | null = null;

  constructor() {}

  async ngAfterViewInit(): Promise<void> {
    // Safe guards for DOM elements
    const revenueEl = document.getElementById('revenue-chart');
    const spark1El = document.getElementById('sparkline-1');
    const spark2El = document.getElementById('sparkline-2');
    const spark3El = document.getElementById('sparkline-3');
    const mapEl = document.getElementById('world-map');

    // Dynamic import ApexCharts and create charts only if containers exist
    if (revenueEl || spark1El || spark2El || spark3El) {
      try {
        const ApexModule = await import('apexcharts');
        const Apex = (ApexModule as any).default ?? ApexModule;

        if (revenueEl) {
          const sales_chart_options = {
            series: [
              {
                name: 'Locação',
                data: [
                  8000.0, 9000.0, 12000.0, 11000.0, 10000.0, 9000.0, 8000.0,
                ],
              },
              {
                name: 'Descarte',
                data: [6500.0, 5900.0, 8000.0, 8100.0, 5600.0, 5500.0, 8000.0],
              },
            ],
            chart: { height: 300, type: 'area', toolbar: { show: false } },
            legend: { show: false },
            colors: ['#0d6efd', '#20c997'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth' },
            xaxis: {
              type: 'datetime',
              categories: [
                '2025-07-01',
                '2025-08-01',
                '2025-09-01',
                '2025-10-01',
                '2025-11-01',
                '2025-12-01',
                '2026-01-01',
              ],
            },
            tooltip: { x: { format: 'MMMM yyyy' } },
          };

          try {
            const salesChart = new Apex(revenueEl, sales_chart_options);
            salesChart.render();
            this.charts.push(salesChart);
          } catch (err) {
            console.warn('ApexCharts revenue init failed', err);
          }
        }

        const sparkOptions = (data: number[]) => ({
          series: [{ data }],
          chart: { type: 'area', height: 50, sparkline: { enabled: true } },
          stroke: { curve: 'straight' },
          fill: { opacity: 0.3 },
          yaxis: { min: 0 },
          colors: ['#DCE6EC'],
        });

        try {
          if (spark1El) {
            const spark1 = new Apex(
              spark1El,
              sparkOptions([1000, 1200, 920, 927, 931, 1027, 819, 930, 1021]),
            );
            spark1.render();
            this.charts.push(spark1);
          }
          if (spark2El) {
            const spark2 = new Apex(
              spark2El,
              sparkOptions([
                515, 519, 520, 522, 652, 810, 370, 627, 319, 630, 921,
              ]),
            );
            spark2.render();
            this.charts.push(spark2);
          }
          if (spark3El) {
            const spark3 = new Apex(
              spark3El,
              sparkOptions([15, 19, 20, 22, 33, 27, 31, 27, 19, 30, 21]),
            );
            spark3.render();
            this.charts.push(spark3);
          }
        } catch (err) {
          console.warn('ApexCharts sparklines init failed', err);
        }
      } catch (err) {
        console.warn('Failed to load ApexCharts', err);
      }
    }

    // jsVectorMap (only if container exists) - use global provided via angular.json scripts
    if (mapEl) {
      try {
        const globalAny = window as any;
        const jsv =
          globalAny.jsVectorMap ??
          (globalAny as any).jsvectormap ??
          (globalAny as any).jsvectormap ??
          null;

        if (jsv) {
          try {
            this.mapInstance = new jsv({
              selector: '#world-map',
              map: 'world',
            });
          } catch (err) {
            console.warn('jsVectorMap instantiation failed', err);
          }
        } else {
          console.warn(
            'jsVectorMap global not found. Verifique angular.json scripts.',
          );
        }
      } catch (err) {
        console.warn('jsVectorMap init failed', err);
      }
    }

    // update/redraw charts on window resize to keep visuals correct
    this.resizeUnlisten = this.addResizeListener();
  }

  ngOnDestroy(): void {
    // destroy charts
    this.charts.forEach((c) => {
      try {
        c.destroy?.();
      } catch {}
    });
    this.charts = [];

    // destroy map
    try {
      this.mapInstance?.destroy?.();
    } catch {}
    this.mapInstance = null;

    // remove resize listener
    if (this.resizeUnlisten) {
      try {
        this.resizeUnlisten();
      } catch {}
      this.resizeUnlisten = null;
    }

    // remove tooltip mousemove listener and optionally remove tip from body
    if (this.tipMousemoveUnlisten) {
      try {
        this.tipMousemoveUnlisten();
      } catch {}
      this.tipMousemoveUnlisten = null;
    }
    if (this.tipEl) {
      try {
        if (this.tipEl.parentElement === document.body) {
          document.body.removeChild(this.tipEl);
        }
      } catch {}
      this.tipEl = null;
    }
  }

  // helper to listen for resize and attempt a safe redraw/update of charts
  private addResizeListener(): () => void {
    const handler = () => {
      this.charts.forEach((c) => {
        try {
          // prefer updateOptions if available, otherwise try render
          if (typeof c.updateOptions === 'function') {
            c.updateOptions({}, true, true);
          } else if (typeof c.render === 'function') {
            c.render();
          }
        } catch {
          // ignore individual chart errors
        }
      });

      // if map instance exposes update/resize, try it
      try {
        this.mapInstance?.update?.();
      } catch {}
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
}
