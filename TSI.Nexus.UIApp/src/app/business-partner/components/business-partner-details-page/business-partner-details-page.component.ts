import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusinessPartnerService, Company, Individual } from '@nexus/core';
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
  ) {}

  ngOnInit(): void {
    this.initialize();
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getBusinessPartnerById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
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
      this.title = 'Cliente';
    } else if (url.includes('suppliers')) {
      this.baseEndPoint = 'suppliers';
      this.title = 'Fornecedor';
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
