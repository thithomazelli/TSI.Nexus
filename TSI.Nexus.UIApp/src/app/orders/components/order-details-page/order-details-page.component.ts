import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Order,
  WebApiResponse,
  OrderStatus,
  OrderService,
  OrderProductService,
  PaymentService,
  BusinessPartnerService,
  DocumentTemplateService,
  downloadLetterheadPdf,
} from '@nexus/core';
import { combineLatest, Subject, Subscription, switchMap, takeUntil, merge, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { buildSalesOrderPages } from '../../utilities/order-documents';
import { HeaderComponent } from '../../../shared/header/header.component';
import { NgIf } from '@angular/common';
import { OrderFormComponent } from '../order-form/order-form.component';
import { OrderProductsComponent } from '../../../order-products/order-products.component';
import { PaymentsComponent } from '../../../payments/payments.component';
import { AttachmentsComponent } from '../../../shared/attachments/attachments.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { EventListComponent } from '../../../shared/components/event-list/event-list.component';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { FeatureToggleKeys } from '../../../core/models/feature-toggle.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-order-details-page',
    templateUrl: './order-details-page.component.html',
    styleUrl: './order-details-page.component.scss',
    imports: [
        HeaderComponent,
        NgIf,
        OrderFormComponent,
        OrderProductsComponent,
        PaymentsComponent,
        AttachmentsComponent,
        AuditTabComponent,
        EventListComponent,
        TranslatePipe,
    ],
})
export class OrderDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Order | null = null;
  id: string | null = null;
  loading = false;
  // Defaults hidden, not enabled: flips to the real value once the
  // combineLatest subscription below resolves - defaulting true showed the
  // Agenda tab immediately, then hid it a moment later if disabled.
  isAgendaEnabled = false;

  activeTab: 'details' | 'products' | 'payments' | 'attachments' | 'agenda' | 'audit' =
    'details';

  orderStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  emittingSalesOrder = false;

  private _orderChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private orderProductService: OrderProductService,
    private paymentService: PaymentService,
    private businessPartnerService: BusinessPartnerService,
    private documentTemplateService: DocumentTemplateService,
    private routerService: Router,
    private featureFlagService: FeatureFlagService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.featureFlagService.isEnabled(FeatureToggleKeys.AgendaModule),
      this.featureFlagService.isEnabled(FeatureToggleKeys.Event),
    ])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([groupEnabled, entityEnabled]) => {
        this.isAgendaEnabled = groupEnabled && entityEnabled;
      });
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

  emitSalesOrder(): void {
    if (!this.data || this.emittingSalesOrder) {
      return;
    }
    const order = this.data;
    this.emittingSalesOrder = true;

    const businessPartner$ = order.businessPartnerId
      ? this.businessPartnerService
          .getById(order.businessPartnerId)
          .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
      : of({ data: null } as WebApiResponse<any>);

    businessPartner$.subscribe({
      next: (response) => {
        this.emittingSalesOrder = false;
        buildSalesOrderPages(
          this.documentTemplateService,
          order,
          response.data ?? null,
        ).subscribe((pages) => {
          downloadLetterheadPdf(pages, `pedido-de-venda-${order.orderNumber}.pdf`);
        });
      },
      error: () => {
        this.emittingSalesOrder = false;
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
