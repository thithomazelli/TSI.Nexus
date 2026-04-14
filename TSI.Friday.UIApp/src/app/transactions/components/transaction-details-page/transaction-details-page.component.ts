import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PaymentStatus,
  Transaction,
  PaymentType,
  WebApiResponse,
  PaymentService,
  TransactionService,
} from '@friday/core';
import { merge, Subject, Subscription, switchMap, takeUntil } from 'rxjs';

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
  activeTab: 'details' | 'payments' | 'attachments' = 'details';

  paymentTypeOptions: Record<PaymentType, string> = {
    [PaymentType.Incoming]: 'Entrada',
    [PaymentType.Outgoing]: 'Saída',
  };

  transactionStatusOptions: Record<PaymentStatus, string> = {
    [PaymentStatus.Approved]: 'Aprovado',
    [PaymentStatus.Delayed]: 'Atrasado',
    [PaymentStatus.Pending]: 'Pendente',
  };

  private _transactionChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private paymentService: PaymentService,
    private routerService: Router,
    private transactionService: TransactionService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getTransactionById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._transactionChangedSub) {
      this._transactionChangedSub.unsubscribe();
    }
  }

  getTransactionStatusLabel(): string {
    if (!this.data?.status || this.data?.status === undefined) {
      return '';
    }
    return this.transactionStatusOptions[this.data.status];
  }

  getPaymentTypeLabel(): string {
    if (!this.data?.type || this.data?.type === undefined) {
      return '';
    }
    return this.paymentTypeOptions[this.data.type];
  }

  private getTransactionById(id: string): void {
    this.loading = true;
    this._transactionChangedSub = merge(
      this.transactionService.transactionChanged$,
      this.paymentService.paymentChanged$,
    )
      .pipe(
        switchMap(() => this.transactionService.getById(id)),
        takeUntil(this._destroy$),
      )
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
