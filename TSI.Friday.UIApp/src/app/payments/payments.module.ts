import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { PaymentsRoutingModule } from './payment-routing.module';
import { PaymentDetailsPageComponent } from './components/payment-details-page/payment-details-page.component';
import { PaymentsComponent } from './payments.component';
import { PaymentInstallmentsModule } from '../payment-installments/payment-installments.module';
import { PaymentsSharedModule } from './payments-shared.module';
import { ClientsSharedModule } from '../clients/clients-shared.module';

@NgModule({
  declarations: [PaymentsComponent, PaymentDetailsPageComponent],
  imports: [
    PaymentsSharedModule,
    PaymentsRoutingModule,
    CommonModule,
    NgxMaskDirective,
    ClientsSharedModule,
    PaymentInstallmentsModule,
  ],
  exports: [],
})
export class PaymentsModule {}
