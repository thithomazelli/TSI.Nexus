import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersComponent } from './orders.component';
import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';

import { OrdersRoutingModule } from './orders-routing.module';
import { NgxMaskDirective } from 'ngx-mask';
import { ProductsModule } from '../products/products.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersSharedModule } from './components/orders-shared.module';
import { ClientsSharedModule } from '../clients/clients-shared.module';
import { TransactionsSharedModule } from '../transactions/transactions-shared.module';
import { OrderProductsModule } from '../order-products/order-products.module';

@NgModule({
  declarations: [OrdersComponent, OrderDetailsPageComponent],
  imports: [
    OrdersSharedModule,
    OrdersRoutingModule,
    CommonModule,
    NgxMaskDirective,
    ClientsSharedModule,
    ProductsModule,
    TransactionsSharedModule,
    PaymentsModule,
    OrderProductsModule,
  ],
  exports: [],
})
export class OrdersModule {}
