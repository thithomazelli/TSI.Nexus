import { Component, OnInit, OnDestroy } from '@angular/core';
import { merge, filter, mergeMap } from 'rxjs';
import { Router } from '@angular/router';
import { ModalService, PaymentService } from '@friday/core';
import { PaymentDetailsModalComponent } from '../../../payments/components/payment-details-modal/payment-details-modal.component';

import {
  ApiService,
  ApiType,
  Payment,
  PaymentStatus,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-payment-notification',
  templateUrl: './payment-notification.component.html',
  styleUrl: './payment-notification.component.scss',
  standalone: false,
})
export class PaymentNotificationComponent implements OnInit, OnDestroy {
  private subscription: any;
  payments: Payment[] = [];
  total: number = 0;

  private _baseEndPoint = ApiType.Payments;

  private _statusIconMap: Record<PaymentStatus, string> = {
    [PaymentStatus.Delayed]: 'bi bi-exclamation-triangle-fill text-danger',
    [PaymentStatus.Pending]: 'bi bi-hourglass-split text-info',
    [PaymentStatus.Approved]: 'bi bi-check-circle-fill text-success',
  };

  private _statusTextMap: Record<PaymentStatus, string> = {
    [PaymentStatus.Delayed]: 'Pagamento atrasado',
    [PaymentStatus.Pending]: 'Pagamento pendente',
    [PaymentStatus.Approved]: 'Pagamento aprovado',
  };

  constructor(
    private apiService: ApiService,
    private paymentService: PaymentService,
    private modalService: ModalService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscription = merge(
      this.apiService.get<WebApiResponse<Payment[]>>(
        `${this._baseEndPoint}/getDelayed`,
      ),
      this.paymentService.hasPaymentChanged().pipe(
        filter((changed) => changed === true),
        mergeMap(() =>
          this.apiService.get<WebApiResponse<Payment[]>>(
            `${this._baseEndPoint}/getDelayed`,
          ),
        ),
      ),
    ).subscribe({
      next: (response: WebApiResponse<Payment[]>) => {
        this.payments = response?.data || [];
        this.total = this.payments.length;
      },
      error: () => {
        this.payments = [];
        this.total = 0;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get displayPayments(): Payment[] {
    return this.payments.slice(0, 10);
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  get showSeeMore(): boolean {
    return this.total > 10;
  }

  getStatusIcon(payment: Payment): string {
    return this._statusIconMap[payment.status!] || 'bi bi-question-circle';
  }

  getStatusText(payment: Payment): string {
    return this._statusTextMap[payment.status!] || 'Status desconhecido';
  }

  getRelativeDate(date?: Date): string {
    if (!date) {
      return '';
    }

    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return 'Hoje';
    }
    if (diffDays === 1) {
      return 'Ontem';
    }
    return `${diffDays} dias atrás`;
  }

  onOpenModal(payment: Payment) {
    this.modalService.showTemplateModal(PaymentDetailsModalComponent, {
      isEdit: true,
      id: payment.id,
      data: payment,
      parentId: payment.transactionId,
    });
  }

  onSeeMore() {
    // Pass filters: status=Pending,Delayed and endDate=today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const endDate = `${yyyy}-${mm}-${dd}`;
    this.router.navigate(['/payments'], {
      queryParams: {
        status: 'Pending,Delayed',
        endDate,
      },
    });
  }
}
