import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientsComponent } from './clients.component';
import { ClientDetailsPageComponent } from './components/client-details-page/client-details-page.component';

import { ClientsRoutingModule } from './clients-routing.module';
import { ClientsSharedModule } from './clients-shared.module';
import { NgxMaskDirective } from 'ngx-mask';
import { AddressModule } from '../address/address.module';
import { ClientsOrdersListComponent } from './components/client-orders-list/clients-orders-list.component';
import { PaymentInstallmentsModule } from '../payment-installments/payment-installments.module';
import { OrdersSharedModule } from '../orders/components/orders-shared.module';

@NgModule({
  declarations: [
    ClientsComponent,
    ClientDetailsPageComponent,
    ClientsOrdersListComponent,
  ],
  imports: [
    ClientsSharedModule,
    OrdersSharedModule,
    ClientsRoutingModule,
    AddressModule,
    PaymentInstallmentsModule,
    CommonModule,
  ],
  exports: [],
})
export class ClientsModule {}
