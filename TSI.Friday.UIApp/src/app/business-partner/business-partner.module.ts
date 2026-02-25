import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BusinessPartnersComponent } from './business-partners.component';
import { BusinessPartnerDetailsPageComponent } from './components/business-partner-details-page/business-partner-details-page.component';
import { ClientsOrdersListComponent } from './components/client-orders-list/clients-orders-list.component';

import { BusinessPartnerRoutingModule } from './business-partner-routing.module';
import { BusinessPartnerSharedModule } from './business-partner-shared.module';
import { AddressModule } from '../address/address.module';

import { OrdersSharedModule } from '../orders/components/orders-shared.module';
import { PaymentsModule } from '../payments/payments.module';

@NgModule({
  declarations: [
    BusinessPartnersComponent,
    BusinessPartnerDetailsPageComponent,
    ClientsOrdersListComponent,
  ],
  imports: [
    BusinessPartnerSharedModule,
    OrdersSharedModule,
    BusinessPartnerRoutingModule,
    AddressModule,
    PaymentsModule,
    CommonModule,
  ],
  exports: [],
})
export class BusinessPartnerModule {}
