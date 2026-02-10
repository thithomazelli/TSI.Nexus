import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiService,
  ApiType,
  NotificationService,
  Payment,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-payment-details-page',
  templateUrl: './payment-details-page.component.html',
  styleUrl: './payment-details-page.component.scss',
  standalone: false,
})
export class PaymentDetailsPageComponent {
  isEdit = false;
  data?: Payment | null = null;
  id: number | null = null;
  loading = false;
  activeTab: 'form' | 'extra' = 'form';

  private _baseEndPoint: ApiType = ApiType.Payments;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private routerService: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      const numericId = Number(idParam);
      if (isNaN(numericId)) {
        this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
        return;
      }
      this.isEdit = true;
      this.id = numericId;
      this.loadPayment(numericId);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  save(payment: Payment): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Payment>>(`${this._baseEndPoint}/update`, payment)
        .subscribe((response: WebApiResponse<Payment>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Payment>>(`${this._baseEndPoint}/add`, payment)
        .subscribe((response: WebApiResponse<Payment>) => {
          this.routerService.navigateByUrl(
            `/${this._baseEndPoint}/${response.data.id}`,
          );
        });
    }
  }

  cancel(): void {
    this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
  }

  private loadPayment(id: number): void {
    this.loading = true;
    this.apiService
      .get<WebApiResponse<Payment>>(`${this._baseEndPoint}/getById/${id}`)
      .subscribe({
        next: (response: WebApiResponse<Payment>) => {
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
