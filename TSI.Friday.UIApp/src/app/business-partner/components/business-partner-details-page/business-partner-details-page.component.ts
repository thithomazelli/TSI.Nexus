import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiService,
  ApiType,
  BusinessPartner,
  Company,
  Individual,
  NotificationService,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-business-partner-details-page',
  templateUrl: './business-partner-details-page.component.html',
  styleUrl: './business-partner-details-page.component.scss',
  standalone: false,
})
export class BusinessPartnerDetailsPageComponent {
  isEdit = false;
  data: Company | Individual | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'address' | 'orders' | 'transaction' | 'payments' =
    'details';
  title: string = '';
  baseEndPoint: string = '';
  canDisplayOrdersTab = true;

  private _baseEndPoint: ApiType = ApiType.BusinessPartners;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private routerService: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.initialize();
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.loadBusinessPartner(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
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

  save(businessPartner: Company | Individual): void {
    this._baseEndPoint =
      businessPartner.documentType === 'Física'
        ? ApiType.Individuals
        : ApiType.Companies;

    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<Company | Individual>
        >(`${this._baseEndPoint}/update`, businessPartner)
        .subscribe((response: WebApiResponse<Company | Individual>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
          this.data = response.data;
        });
    } else {
      this.apiService
        .post<
          WebApiResponse<BusinessPartner>
        >(`${this._baseEndPoint}/add`, businessPartner)
        .subscribe((response: WebApiResponse<BusinessPartner>) => {
          this.routerService.navigateByUrl(
            `/${this._baseEndPoint}/${response.data.id}`,
          );
        });
    }
  }

  cancel(): void {
    this.routerService.navigateByUrl('/clients');
  }

  private loadBusinessPartner(id: string): void {
    this.loading = true;
    this.apiService
      .get<
        WebApiResponse<BusinessPartner>
      >(`${this._baseEndPoint}/getById/${id}`)
      .subscribe({
        next: (response: WebApiResponse<BusinessPartner>) => {
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
