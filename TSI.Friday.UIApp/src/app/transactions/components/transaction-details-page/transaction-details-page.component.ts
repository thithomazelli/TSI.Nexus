import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PaymentStatus,
  Transaction,
  PaymentType,
  WebApiResponse,
  PaymentService,
  TransactionService,
  TranslationService,
} from '@friday/core';
import { merge, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { NgIf } from '@angular/common';
import { TransactionFormComponent } from '../transactions-form/transaction-form.component';
import { PaymentsComponent } from '../../../payments/payments.component';
import { AttachmentsComponent } from '../../../shared/attachments/attachments.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-transaction-details-page',
    templateUrl: './transaction-details-page.component.html',
    styleUrl: './transaction-details-page.component.scss',
    imports: [
        HeaderComponent,
        NgIf,
        TransactionFormComponent,
        PaymentsComponent,
        AttachmentsComponent,
        AuditTabComponent,
        TranslatePipe,
    ],
})
export class TransactionDetailsPageComponent {
  isEdit = false;
  data?: Transaction | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'payments' | 'attachments' | 'audit' = 'details';

  get paymentTypeOptions(): Record<PaymentType, string> {
    return {
      [PaymentType.Incoming]: this.translationService.instant('REPORTS.INCOMING'),
      [PaymentType.Outgoing]: this.translationService.instant('REPORTS.OUTGOING'),
    };
  }

  get transactionStatusOptions(): Record<PaymentStatus, string> {
    return {
      [PaymentStatus.Approved]: this.translationService.instant('TRANSACTIONS.STATUS_APPROVED'),
      [PaymentStatus.Delayed]: this.translationService.instant('REPORTS.STATUS_DELAYED'),
      [PaymentStatus.Pending]: this.translationService.instant('TRANSACTIONS.STATUS_PENDING'),
    };
  }

  private _transactionChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private paymentService: PaymentService,
    private routerService: Router,
    private transactionService: TransactionService,
    private translationService: TranslationService,
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
