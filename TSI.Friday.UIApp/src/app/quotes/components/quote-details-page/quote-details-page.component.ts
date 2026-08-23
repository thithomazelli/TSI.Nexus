import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Quote,
  WebApiResponse,
  QuoteStatus,
  QuoteService,
  QuoteProductService,
  BusinessPartnerService,
  DocumentTemplateService,
  downloadLetterheadPdf,
} from '@friday/core';
import { combineLatest, Subject, Subscription, switchMap, takeUntil, merge, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { buildQuotePages } from '../../utilities/quote-documents';
import { HeaderComponent } from '../../../shared/header/header.component';
import { NgIf } from '@angular/common';
import { QuoteFormComponent } from '../quote-form/quote-form.component';
import { QuoteProductsComponent } from '../../../quote-products/quote-products.component';
import { AttachmentsComponent } from '../../../shared/attachments/attachments.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { EventListComponent } from '../../../shared/components/event-list/event-list.component';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { FeatureToggleKeys } from '../../../core/models/feature-toggle.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-quote-details-page',
    templateUrl: './quote-details-page.component.html',
    styleUrl: './quote-details-page.component.scss',
    imports: [
        HeaderComponent,
        NgIf,
        QuoteFormComponent,
        QuoteProductsComponent,
        AttachmentsComponent,
        AuditTabComponent,
        EventListComponent,
        TranslatePipe,
    ],
})
export class QuoteDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Quote | null = null;
  id: string | null = null;
  loading = false;
  isAgendaEnabled = true;

  activeTab: 'details' | 'products' | 'attachments' | 'agenda' | 'audit' = 'details';

  quoteStatusOptions: Record<QuoteStatus, string> = {
    [QuoteStatus.Open]: 'Em aberto',
    [QuoteStatus.Canceled]: 'Cancelado',
    [QuoteStatus.Converted]: 'Convertido',
    [QuoteStatus.Expired]: 'Expirado',
  };

  emittingQuote = false;

  private _quoteChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private quoteService: QuoteService,
    private quoteProductService: QuoteProductService,
    private routerService: Router,
    private businessPartnerService: BusinessPartnerService,
    private documentTemplateService: DocumentTemplateService,
    private featureFlagService: FeatureFlagService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.featureFlagService.isEnabled(FeatureToggleKeys.AgendaModule),
      this.featureFlagService.isEnabled(FeatureToggleKeys.Event),
    ])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([groupEnabled, entityEnabled]) => {
        this.isAgendaEnabled = groupEnabled && entityEnabled;
      });
    const idOrNumber = this.activatedRoute.snapshot.paramMap.get('id');

    if (idOrNumber && idOrNumber !== 'new') {
      this.isEdit = true;
      this.id = idOrNumber;
      if (this.isGuid(idOrNumber)) {
        this.getQuoteById(idOrNumber);
      } else {
        this.getQuoteByQuoteNumber(idOrNumber);
      }
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

  emitQuote(): void {
    if (!this.data || this.emittingQuote) {
      return;
    }
    const quote = this.data;
    this.emittingQuote = true;

    const businessPartner$ = quote.businessPartnerId
      ? this.businessPartnerService
          .getById(quote.businessPartnerId)
          .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
      : of({ data: null } as WebApiResponse<any>);

    businessPartner$.subscribe({
      next: (response) => {
        this.emittingQuote = false;
        buildQuotePages(
          this.documentTemplateService,
          quote,
          response.data ?? null,
        ).subscribe((pages) => {
          downloadLetterheadPdf(pages, `orcamento-${quote.quoteNumber}.pdf`);
        });
      },
      error: () => {
        this.emittingQuote = false;
      },
    });
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

  private getQuoteByQuoteNumber(quoteNumber: string): void {
    this.loading = true;
    this._quoteChangedSub = merge(
      this.quoteService.quoteChanged$,
      this.quoteProductService.quoteProductChanged$,
    )
      .pipe(
        switchMap(() => this.quoteService.getByQuoteNumber(quoteNumber)),
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

  private isGuid(value: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      value,
    );
  }
}
