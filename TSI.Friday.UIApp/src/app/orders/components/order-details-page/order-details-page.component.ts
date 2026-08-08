import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Order,
  WebApiResponse,
  OrderStatus,
  OrderService,
  OrderProductService,
  PaymentService,
} from '@friday/core';
import { Subject, Subscription, switchMap, takeUntil, merge } from 'rxjs';

import html2pdf from 'html2pdf.js';

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

  activeTab:
    | 'details'
    | 'products'
    | 'triplegs'
    | 'passengers'
    | 'payments'
    | 'attachments' = 'details';

  orderStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  private _orderChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private orderProductService: OrderProductService,
    private paymentService: PaymentService,
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

  emitContract(): void {
    if (!this.data) {
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.innerHTML = this.buildContractHtml(this.data);
    document.body.appendChild(tempDiv);

    html2pdf()
      .from(tempDiv)
      .set({
        margin: 0.5,
        filename: `contrato-${this.data.orderNumber}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .save()
      .finally(() => {
        document.body.removeChild(tempDiv);
      });
  }

  private buildContractHtml(order: Order): string {
    const today = new Date().toLocaleDateString('pt-BR');
    const totalPrice = (order.totalPrice ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return `
      <div style="font-family: Arial, sans-serif; padding: 24px; font-size: 13px; color:#222;">
        <h2 style="text-align:center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE</h2>
        <p><b>Pedido:</b> ${order.orderNumber ?? ''} &nbsp; <b>Data:</b> ${today}</p>
        <p><b>Contratante:</b> ${order.businessPartnerName ?? '-'}</p>
        <p><b>Veículo:</b> ${order.vehiclePlate ?? '-'} &nbsp; <b>Motorista:</b> ${order.driverName ?? '-'}</p>
        <p><b>Roteiro:</b> ${order.route || '-'}</p>
        <p><b>Distância:</b> ${order.distanceKm ?? 0} km &nbsp; <b>Diárias:</b> ${order.dailyCount ?? 0}</p>
        <p><b>Valor total:</b> ${totalPrice}</p>
        <p style="margin-top: 24px;">
          Pelo presente instrumento particular, as partes acima identificadas ajustam a prestação
          dos serviços de transporte descritos neste documento, nas condições e valores acima
          informados, obrigando-se ao fiel cumprimento do presente contrato.
        </p>
        <div style="margin-top: 60px; display:flex; justify-content: space-between;">
          <div style="text-align:center; width:45%; border-top:1px solid #333; padding-top:4px;">
            Contratante
          </div>
          <div style="text-align:center; width:45%; border-top:1px solid #333; padding-top:4px;">
            Serodio Turismo
          </div>
        </div>
      </div>
    `;
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
