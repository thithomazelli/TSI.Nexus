import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PurchaseOrder,
  WebApiResponse,
  OrderStatus,
  PurchaseOrderService,
  PurchaseOrderProductService,
  PaymentService,
} from '@friday/core';
import { Subject, Subscription, switchMap, takeUntil, merge } from 'rxjs';

import { HeaderComponent } from '../../../shared/header/header.component';
import { NgIf } from '@angular/common';
import { PurchaseOrderFormComponent } from '../purchase-order-form/purchase-order-form.component';
import { PurchaseOrderProductsComponent } from '../../../purchase-order-products/purchase-order-products.component';
import { PaymentsComponent } from '../../../payments/payments.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-purchase-order-details-page',
    templateUrl: './purchase-order-details-page.component.html',
    styleUrl: './purchase-order-details-page.component.scss',
    imports: [
        HeaderComponent,
        NgIf,
        PurchaseOrderFormComponent,
        PurchaseOrderProductsComponent,
        PaymentsComponent,
        AuditTabComponent,
        TranslatePipe,
    ],
})
export class PurchaseOrderDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: PurchaseOrder | null = null;
  id: string | null = null;
  loading = false;

  activeTab: 'details' | 'products' | 'payments' | 'audit' = 'details';

  purchaseOrderStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  private _purchaseOrderChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    private purchaseOrderProductService: PurchaseOrderProductService,
    private paymentService: PaymentService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getPurchaseOrderById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._purchaseOrderChangedSub) {
      this._purchaseOrderChangedSub.unsubscribe();
    }
  }

  getStatusLabel(): string {
    if (!this.data || this.data.status == null) {
      return '';
    }

    return this.purchaseOrderStatusOptions[this.data?.status] || '';
  }

  private getPurchaseOrderById(id: string): void {
    this.loading = true;
    this._purchaseOrderChangedSub = merge(
      this.purchaseOrderService.purchaseOrderChanged$,
      this.purchaseOrderProductService.purchaseOrderProductChanged$,
      this.paymentService.paymentChanged$,
    )
      .pipe(
        switchMap(() => this.purchaseOrderService.getById(id)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (response: WebApiResponse<PurchaseOrder>) => {
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
