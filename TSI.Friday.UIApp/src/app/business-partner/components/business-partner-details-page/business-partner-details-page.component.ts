import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BusinessPartnerService,
  BusinessPartnerType,
  Company,
  Individual,
  TranslationService,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-business-partner-details-page',
  templateUrl: './business-partner-details-page.component.html',
  styleUrl: './business-partner-details-page.component.scss',
  standalone: false,
})
export class BusinessPartnerDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data: Company | Individual | null = null;
  id: string | null = null;
  loading = false;
  activeTab:
    | 'details'
    | 'address'
    | 'orders'
    | 'transaction'
    | 'payments'
    | 'attachments' = 'details';
  title: string = '';
  baseEndPoint: string = '';
  canDisplayOrdersTab = true;

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private businessPartnerService: BusinessPartnerService,
    private routerService: Router,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    this.initialize();
    this.translationService.language$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.initialize());
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getBusinessPartnerById(idParam);
    } else {
      this.isEdit = false;
      // business-partner-form's `type` control is required but has no visible input of its own -
      // it's meant to be set from context (Client vs Supplier), the same way the list page's
      // "Adicionar" modal already does via business-partners.component.ts's openModal(). Without
      // this, the form is permanently invalid and "Adicionar Cliente"/"Adicionar Fornecedor" via
      // the full page (as opposed to the modal) could never actually be submitted.
      this.data = {
        type:
          this.baseEndPoint === 'clients'
            ? BusinessPartnerType.Client
            : BusinessPartnerType.Supplier,
      } as Individual;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private initialize(): void {
    const url = this.routerService.url;
    if (url.includes('clients')) {
      this.baseEndPoint = 'clients';
      this.title = this.translationService.instant(
        'BUSINESS_PARTNER.CLIENT_SINGULAR',
      );
    } else if (url.includes('suppliers')) {
      this.baseEndPoint = 'suppliers';
      this.title = this.translationService.instant(
        'BUSINESS_PARTNER.SUPPLIER_SINGULAR',
      );
      this.canDisplayOrdersTab = false;
    } else {
      this.baseEndPoint = '';
      this.title = '';
    }
  }

  private getBusinessPartnerById(id: string): void {
    this.loading = true;
    this.businessPartnerService
      .getById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
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
