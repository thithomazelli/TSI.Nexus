import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ModalService,
  Product,
  ProductService,
  WebApiResponse,
} from '@nexus/core';
import { Subject, takeUntil } from 'rxjs';
import { NgIf, NgFor } from '@angular/common';

import { PurchaseOrderDetailsModalComponent } from '../../../purchase-orders/components/purchase-order-details-modal/purchase-order-details-modal.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

// Erro (vermelho): produto sem estoque (<=0). Aviso (amarelo): estoque baixo (>0 e <=3). Mesmo
// padrão dos demais alertas da navbar - busca os próprios dados via ProductService.getAll() e
// filtra client-side, sem endpoint dedicado (ver VehicleBlockedNotificationComponent).
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-stock-alert-notification',
    templateUrl: './stock-alert-notification.component.html',
    styleUrl: './stock-alert-notification.component.scss',
    imports: [NgIf, NgFor, TranslatePipe],
})
export class StockAlertNotificationComponent implements OnInit, OnDestroy {
  outOfStockProducts: Product[] = [];
  lowStockProducts: Product[] = [];
  total = 0;

  private _destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private modalService: ModalService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  // Caps what actually renders per group - the dropdown has no natural height limit otherwise,
  // and with enough alerts it would grow past the viewport with no way to scroll to the footer
  // link below it (see .notification-list in the stylesheet for the scroll fallback).
  get displayOutOfStockProducts(): Product[] {
    return this.outOfStockProducts.slice(0, 10);
  }

  get displayLowStockProducts(): Product[] {
    return this.lowStockProducts.slice(0, 10);
  }

  openProduct(product: Product): void {
    this.modalService.showTemplateModal(PurchaseOrderDetailsModalComponent, {
      isEdit: false,
      preselectedProductId: product.id,
    });
  }

  onSeeAll(): void {
    this.router.navigate(['/products'], {
      queryParams: { stockStatus: 'Low' },
    });
  }

  private load(): void {
    this.productService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Product[]>) => {
        const products = response?.data || [];
        this.outOfStockProducts = products.filter(
          (p) => (p.quantityInStock ?? 0) <= 0,
        );
        this.lowStockProducts = products.filter(
          (p) => (p.quantityInStock ?? 0) > 0 && (p.quantityInStock ?? 0) <= 3,
        );
        this.total = this.outOfStockProducts.length + this.lowStockProducts.length;
        this.cdr.markForCheck();
      });
  }
}
