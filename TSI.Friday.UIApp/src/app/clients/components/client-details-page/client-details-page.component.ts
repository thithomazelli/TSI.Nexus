import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiService,
  ApiType,
  Client,
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
  activeTab: 'form' | 'image' | 'address' | 'orders' | 'extra' = 'form';

  private _baseEndPoint: ApiType = ApiType.Clients;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private routerService: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // Usa a URL do router para pegar o primeiro segmento
    const rootSegment = this.routerService.url.split('/')[1];
    if (rootSegment === 'individuals') {
      this._baseEndPoint = ApiType.Individuals;
    } else if (rootSegment === 'companies') {
      this._baseEndPoint = ApiType.Companies;
    }

    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.loadClient(Number(idParam));
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  save(client: Company | Individual): void {
    this._baseEndPoint =
      client.type === 'Física' ? ApiType.Individuals : ApiType.Companies;

    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<Company | Individual>
        >(`${this._baseEndPoint}/update`, client)
        .subscribe((response: WebApiResponse<Company | Individual>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Client>>(`${this._baseEndPoint}/add`, client)
        .subscribe((response: WebApiResponse<Client>) => {
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

  private loadClient(id: number): void {
    this.loading = true;
    this.apiService
      .get<
        WebApiResponse<Company | Individual>
      >(`${this._baseEndPoint}/getById/${id}`)
      .subscribe({
        next: (response: WebApiResponse<Company | Individual>) => {
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
