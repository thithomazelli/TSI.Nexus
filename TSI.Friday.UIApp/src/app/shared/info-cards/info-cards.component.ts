import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService, DashboardCard, WebApiResponse } from '@friday/core';
import { ApiType } from '../../core/enums/api-type.enum';

@Component({
  selector: 'app-info-cards',
  standalone: false,
  templateUrl: './info-cards.component.html',
  styleUrl: './info-cards.component.scss',
})
export class InfoCardsComponent implements OnInit {
  loading = true;
  cards: DashboardCard[] = [];

  private _baseEndPoint = ApiType.Dashboard;
  // Mapeamento de titles exatos para SVGs
  private _iconMap: { [key: string]: string } = {
    // Recibo
    'Novos Pedidos': `<svg class="small-box-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    // Check/caixa marcada
    'Recebidos (%)': `<svg class="small-box-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.1 2.09 5.59-5.59a1 1 0 1 1 1.41 1.41l-6.3 6.29a1 1 0 0 1-1.4 0z"/><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-2c4.41 0 8-3.59 8-8s-3.59-8-8-8-8 3.59-8 8 3.59 8 8 8z"/></svg>`,
    // Relógio
    'Aguardando (%)': `<svg class="small-box-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    // Alerta/erro
    'Devoluções em Atraso': `<svg class="small-box-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`,
  };

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}
  // Monta rota e params para cada card
  getCardLink(card: DashboardCard): { route: any[]; queryParams?: any } {
    // Backend usa datas UTC, startDate = hoje-30, endDate = hoje (ambos 00:00 UTC)
    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        30 * 24 * 60 * 60 * 1000,
    );
    const startDate = from.toISOString().slice(0, 10); // yyyy-MM-dd
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
      .toISOString()
      .slice(0, 10);
    switch (card.title) {
      case 'Novos Pedidos':
        return {
          route: ['/orders'],
          queryParams: { startDate, endDate },
        };
      case 'Recebidos (%)':
        return {
          route: ['/payments'],
          queryParams: {
            startDate,
            endDate,
            status: 'Approved',
            type: 'Incoming',
          },
        };
      case 'Aguardando (%)':
        // Backend soma Pending + Delayed
        return {
          route: ['/payments'],
          queryParams: { startDate, endDate, status: 'Pending,Delayed' },
        };
      case 'Devoluções em Atraso':
        return {
          route: ['/orderProducts'],
          queryParams: { status: 'Delayed' },
        };
      default:
        return { route: ['/'] };
    }
  }

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.loading = true;
    this.apiService
      .get<
        WebApiResponse<DashboardCard[]>
      >(`${this._baseEndPoint}/getInfoCards`)
      .subscribe({
        next: (response: WebApiResponse<DashboardCard[]>) => {
          this.cards = response.data ?? [];
        },
        error: () => {
          this.cards = [];
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  trackByInfoCard(index: number, card: DashboardCard): string {
    return card.title;
  }

  // Retorna a cor do card baseada no título
  getCardColor(card: DashboardCard): string {
    const title = card.title?.toLowerCase() || '';
    if (title.includes('pedido') && !title.includes('atraso')) {
      return 'text-bg-primary';
    }
    if (title.includes('recebido')) {
      const percent = Number(
        (card.value || '').toString().replace(/[^\d.]/g, ''),
      );
      if (percent >= 80) {
        return 'text-bg-success';
      }
      if (percent >= 50) {
        return 'text-bg-warning';
      }
      return 'text-bg-danger';
    }
    if (title.includes('aguardando')) {
      return 'text-bg-warning';
    }
    if (title.includes('atraso')) {
      const qtd = Number((card.value || '').toString().replace(/[^\d.]/g, ''));
      return qtd === 0 ? 'text-bg-success' : 'text-bg-danger';
    }
    return 'text-bg-primary';
  }

  // Retorna o SVG do ícone baseado no título
  getCardIcon(card: DashboardCard): SafeHtml {
    const title = card.title || '';
    let svg = this._iconMap[title];
    if (!svg) {
      svg = `<svg class=\"small-box-icon\" fill=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"10\"/></svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  onViewDetails(card: DashboardCard): void {
    const link = this.getCardLink(card);
    this.router.navigate(link.route, { queryParams: link.queryParams });
  }
}
