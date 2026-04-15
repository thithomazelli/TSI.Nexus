import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Quote,
  WebApiResponse,
  QuoteStatus,
  QuoteService,
  QuoteProductService,
} from '@friday/core';
import { Subject, Subscription, switchMap, takeUntil, merge } from 'rxjs';

@Component({
  selector: 'app-quote-details-page',
  templateUrl: './quote-details-page.component.html',
  styleUrl: './quote-details-page.component.scss',
  standalone: false,
})
export class QuoteDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Quote | null = null;
  id: string | null = null;
  loading = false;

  activeTab: 'details' | 'products' | 'attachments' = 'details';

  quoteStatusOptions: Record<QuoteStatus, string> = {
    [QuoteStatus.Open]: 'Em aberto',
    [QuoteStatus.Canceled]: 'Cancelado',
    [QuoteStatus.Converted]: 'Convertido',
    [QuoteStatus.Expired]: 'Expirado',
  };

  private _quoteChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private quoteService: QuoteService,
    private quoteProductService: QuoteProductService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getQuoteById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._quoteChangedSub) {
      this._quoteChangedSub.unsubscribe();
    }
  }

  getStatusLabel(): string {
    if (!this.data || this.data.status == null) {
      return '';
    }

    return this.quoteStatusOptions[this.data?.status] || '';
  }

  private getQuoteById(id: string): void {
    this.loading = true;
    this._quoteChangedSub = merge(
      this.quoteService.quoteChanged$,
      this.quoteProductService.quoteProductChanged$,
    )
      .pipe(
        switchMap(() => this.quoteService.getById(id)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (response: WebApiResponse<Quote>) => {
          this.loading = false;
          if (response.data == null) {
            this.routerService.navigateByUrl('/not-found');
            return;
          }
          this.data = response.data;
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }
}
