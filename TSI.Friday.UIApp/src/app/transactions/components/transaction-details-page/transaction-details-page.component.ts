import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiService,
  ApiType,
  NotificationService,
  PaymentStatus,
  Transaction,
  TransactionType,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-transaction-details-page',
  templateUrl: './transaction-details-page.component.html',
  styleUrl: './transaction-details-page.component.scss',
  standalone: false,
})
export class TransactionDetailsPageComponent {
  isEdit = false;
  data?: Transaction | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'payments' = 'details';

  transactionTypeOptions = [
    { label: 'Entrada', value: TransactionType.Incoming },
    { label: 'Saída', value: TransactionType.Outgoing },
  ];

  transactionStatusOptions = [
    { label: 'Aprovado', value: PaymentStatus.Approved },
    { label: 'Atrasado', value: PaymentStatus.Delayed },
    { label: 'Pendente', value: PaymentStatus.Pending },
  ];

  private _baseEndPoint: ApiType = ApiType.Transactions;

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
      this.loadTransaction(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  save(payment: Transaction): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<Transaction>
        >(`${this._baseEndPoint}/update`, payment)
        .subscribe((response: WebApiResponse<Transaction>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Transaction>>(`${this._baseEndPoint}/add`, payment)
        .subscribe((response: WebApiResponse<Transaction>) => {
          this.routerService.navigateByUrl(
            `/${this._baseEndPoint}/${response.data.id}`,
          );
        });
    }
  }

  cancel(): void {
    this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
  }

  onTransactionUpdated(): void {
    if (this.id) {
      this.loadTransaction(this.id);
    }
  }

  private loadTransaction(id: string): void {
    this.loading = true;
    this.apiService
      .get<WebApiResponse<Transaction>>(`${this._baseEndPoint}/getById/${id}`)
      .subscribe({
        next: (response: WebApiResponse<Transaction>) => {
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
