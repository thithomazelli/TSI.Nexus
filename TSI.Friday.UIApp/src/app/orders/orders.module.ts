import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';
import { TripLegListComponent } from './components/trip-leg-list/trip-leg-list.component';
import { PassengerListComponent } from './components/passenger-list/passenger-list.component';
import { PassengerImportComponent } from './components/passenger-import/passenger-import.component';

import { OrdersRoutingModule } from './orders-routing.module';
import { NgxMaskDirective } from 'ngx-mask';
import { ProductsModule } from '../products/products.module';
import { PaymentsModule } from '../payments/payments.module';

import { BusinessPartnerSharedModule } from '../business-partner/business-partner-shared.module';

import { TransactionsSharedModule } from '../transactions/transactions-shared.module';
import { OrderProductsSharedModule } from '../order-products/order-products-shared.module';
import { OrdersSharedModule } from './orders-shared.module';

@NgModule({
  declarations: [
    OrderDetailsPageComponent,
    TripLegListComponent,
    PassengerListComponent,
    PassengerImportComponent,
  ],
  imports: [
    OrdersSharedModule,
    OrdersRoutingModule,
    CommonModule,
    NgxMaskDirective,
    BusinessPartnerSharedModule,
    ProductsModule,
    TransactionsSharedModule,
    PaymentsModule,
    OrderProductsSharedModule,
  ],
  exports: [],
})
export class OrdersModule {}
