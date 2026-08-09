import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Order,
  Payment,
  WebApiResponse,
  OrderStatus,
  OrderService,
  OrderProductService,
  PaymentService,
  BusinessPartnerService,
  downloadLetterheadPdf,
} from '@friday/core';
import { Subject, Subscription, switchMap, takeUntil, merge, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  buildContractPages,
  buildSalesOrderPages,
  buildServiceOrderPages,
} from '../../utilities/order-documents';

type EmittableDocument = 'salesOrder' | 'contract' | 'serviceOrder';

@Component({
  selector: 'app-order-details-page',
  templateUrl: './order-details-page.component.html',
  styleUrl: './order-details-page.component.scss',
  standalone: false,
})
export class OrderDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Order | null = null;
  id: string | null = null;
  loading = false;

  activeTab: 'details' | 'products' | 'payments' | 'attachments' = 'details';

  orderStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  emittingDocument: EmittableDocument | null = null;

  private _orderChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private orderProductService: OrderProductService,
    private paymentService: PaymentService,
    private businessPartnerService: BusinessPartnerService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getOrderById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._orderChangedSub) {
      this._orderChangedSub.unsubscribe();
    }
  }

  getStatusLabel(): string {
    if (!this.data || this.data.status == null) {
      return '';
    }

    return this.orderStatusOptions[this.data?.status] || '';
  }

  emitDocument(type: EmittableDocument): void {
    if (!this.data?.id || this.emittingDocument) {
      return;
    }
    const order = this.data;
    const orderId = order.id!;
    this.emittingDocument = type;

    const businessPartner$ = order.businessPartnerId
      ? this.businessPartnerService
          .getById(order.businessPartnerId)
          .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
      : of({ data: null } as WebApiResponse<any>);
    const payments$ = this.paymentService
      .getByEntityId(orderId, 'Order')
      .pipe(catchError(() => of({ data: [] as Payment[] } as WebApiResponse<Payment[]>)));

    forkJoin({ businessPartner: businessPartner$, payments: payments$ }).subscribe({
      next: ({ businessPartner, payments }) => {
        this.emittingDocument = null;
        const partner = businessPartner.data ?? null;
        const paymentList = payments.data ?? [];

        switch (type) {
          case 'salesOrder':
            downloadLetterheadPdf(
              buildSalesOrderPages(order, partner, paymentList),
              `pedido-de-venda-${order.orderNumber}.pdf`,
            );
            break;
          case 'contract':
            downloadLetterheadPdf(
              buildContractPages(order, partner, paymentList),
              `contrato-${order.orderNumber}.pdf`,
            );
            break;
          case 'serviceOrder':
            downloadLetterheadPdf(
              buildServiceOrderPages(order, partner),
              `os-${order.orderNumber}.pdf`,
            );
            break;
        }
      },
      error: () => {
        this.emittingDocument = null;
      },
    });
  }

  private getOrderById(id: string): void {
    this.loading = true;
    this._orderChangedSub = merge(
      this.orderService.orderChanged$,
      this.orderProductService.orderProductChanged$,
      this.paymentService.paymentChanged$,
    )
      .pipe(
        switchMap(() => this.orderService.getById(id)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (response: WebApiResponse<Order>) => {
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
