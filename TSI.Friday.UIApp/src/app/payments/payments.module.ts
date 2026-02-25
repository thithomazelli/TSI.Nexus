import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { PaymentsComponent } from './payments.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { PaymentDetailsModalComponent } from './components/payment-details-modal/payment-details-modal.component';
import { PaymentsRoutingModule } from './payments.routing.module';

@NgModule({
  declarations: [
    PaymentsComponent,
    PaymentFormComponent,
    PaymentDetailsModalComponent,
  ],
  imports: [CommonModule, SharedModule, PaymentsRoutingModule],
  exports: [PaymentsComponent],
})
export class PaymentsModule {}
