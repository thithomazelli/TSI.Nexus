import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';
import { PaymentsRoutingModule } from './payment-routing.module';
import { PaymentDetailsModalComponent } from './components/payment-details-modal/payment-details-modal.component';
import { PaymentDetailsPageComponent } from './components/payment-details-page/payment-details-page.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { PaymentsComponent } from './payments.component';
import { ClientsModule } from '../clients/clients.module';
import { PaymentInstallmentsModule } from '../payment-installments/payment-installments.module';

@NgModule({
  declarations: [
    PaymentsComponent,
    PaymentDetailsModalComponent,
    PaymentDetailsPageComponent,
    PaymentFormComponent,
  ],
  imports: [
    PaymentsRoutingModule,
    CommonModule,
    SharedModule,
    NgxMaskDirective,
    ClientsModule,
    PaymentInstallmentsModule,
  ],
  exports: [PaymentFormComponent],
})
export class PaymentsModule {}
