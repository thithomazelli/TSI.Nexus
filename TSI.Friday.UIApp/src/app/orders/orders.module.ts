import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersComponent } from './orders.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';

import { OrdersRoutingModule } from './orders-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';
import { ClientsModule } from '../clients/clients.module';
import { OrderProductsModule } from '../order-products/order-products.module';
import { ProductsModule } from '../products/products.module';
import { PaymentInstallmentsModule } from '../payment-installments/payment-installments.module';

@NgModule({
  declarations: [
    OrdersComponent,
    OrderFormComponent,
    OrderDetailsModalComponent,
    OrderDetailsPageComponent,
  ],
  imports: [
    OrderProductsModule,
    CommonModule,
    OrdersRoutingModule,
    SharedModule,
    NgxMaskDirective,
    ClientsModule,
    ProductsModule,
    PaymentInstallmentsModule,
  ],
})
export class OrdersModule {}
