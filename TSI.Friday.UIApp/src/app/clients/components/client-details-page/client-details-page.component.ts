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
  selector: 'app-client-details-page',
  standalone: false,
  templateUrl: './client-details-page.component.html',
  styleUrl: './client-details-page.component.scss',
})
export class ClientDetailsPageComponent {
  isEdit = false;
  data?: Company | Individual | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'address' | 'orders' | 'payments' = 'details';

  private _baseEndPoint: ApiType = ApiType.BusinessPartners;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private routerService: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.loadBusinessPartner(Number(idParam));
    } else {
      this.isEdit = false;
      this.data = null;
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

  onImageChange(event: any): void {
    if (!event?.fileName) {
      return;
    }
    this.data!.photo = event.fileName;
    // Força atualização do ClientFormComponent
    this.data = JSON.parse(JSON.stringify(this.data));
  }

  private loadBusinessPartner(id: number): void {
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
