import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientsComponent } from './clients.component';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { ClientDetailsModalComponent } from './components/client-details-modal/client-details-modal.component';
import { ClientDetailsPageComponent } from './components/client-details-page/client-details-page.component';

import { ClientsRoutingModule } from './clients-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';
import { AddressModule } from '../address/address.module';
import { ClientsOrdersListComponent } from './components/client-orders-list/clients-orders-list.component';
import { PaymentInstallmentsModule } from '../payment-installments/payment-installments.module';

@NgModule({
  declarations: [
    ClientsComponent,
    ClientFormComponent,
    ClientDetailsModalComponent,
    ClientDetailsPageComponent,
    ClientsOrdersListComponent,
  ],
  imports: [
    AddressModule,
    PaymentInstallmentsModule,
    CommonModule,
    ClientsRoutingModule,
    SharedModule,
    NgxMaskDirective,
  ],
  exports: [ClientDetailsModalComponent],
})
export class ClientsModule {}
