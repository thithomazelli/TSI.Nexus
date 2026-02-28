import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { TransactionType } from '../core/enums/payment-type.enum';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  TransactionType = TransactionType;
  showFilters = false;
  filterStart: Date | null = null;
  filterEnd: Date | null = null;

  private charts: any[] = [];
  private resizeUnlisten: (() => void) | null = null;
  private tipEl: HTMLElement | null = null;
  private tipMousemoveUnlisten: (() => void) | null = null;

  constructor() {}

  async ngAfterViewInit(): Promise<void> {
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

  applyFilter() {
    // Apenas força atualização dos gráficos, pois os inputs já são passados
    // Pode adicionar lógica extra se necessário
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
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
}
