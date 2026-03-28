import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Subject, takeUntil, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ModalService, PaymentService } from '@friday/core';
import { PaymentDetailsModalComponent } from '../../../payments/components/payment-details-modal/payment-details-modal.component';

import { Payment, PaymentStatus, WebApiResponse } from '@friday/core';

@Component({
  selector: 'app-payment-notification',
  templateUrl: './payment-notification.component.html',
  styleUrl: './payment-notification.component.scss',
  standalone: false,
})
export class PaymentNotificationComponent implements OnInit, OnDestroy {
  payments: Payment[] = [];
  total: number = 0;

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

  private _paymentChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService,
    private paymentService: PaymentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this._paymentChangedSub = this.paymentService.paymentChanged$
      .pipe(
        switchMap(() => this.paymentService.getDelayed()),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<Payment[]>) => {
        this.payments = response?.data || [];
        this.total = this.payments.length;
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._paymentChangedSub) {
      this._paymentChangedSub.unsubscribe();
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
    now.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) {
      return 'Hoje';
    }
    if (diffDays === 1) {
      return 'Ontem';
    }
    return `${diffDays} dias atrás`;
  }

  openModal(payment: Payment) {
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
