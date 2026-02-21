import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersComponent } from './orders.component';
import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';

import { OrdersRoutingModule } from './orders-routing.module';
import { NgxMaskDirective } from 'ngx-mask';
import { ProductsModule } from '../products/products.module';
import { PaymentInstallmentsModule } from '../payment-installments/payment-installments.module';
import { OrdersSharedModule } from './components/orders-shared.module';
import { ClientsSharedModule } from '../clients/clients-shared.module';
import { PaymentsSharedModule } from '../payments/payments-shared.module';

@NgModule({
  declarations: [OrdersComponent, OrderDetailsPageComponent],
  imports: [
    OrdersSharedModule,
    OrdersRoutingModule,
    CommonModule,
    NgxMaskDirective,
    ClientsSharedModule,
    ProductsModule,
    PaymentsSharedModule,
    PaymentInstallmentsModule,
  ],
  exports: [],
})
export class OrdersModule {}
