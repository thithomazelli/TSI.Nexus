import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { PaymentComponent } from './payments.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { PaymentDetailsModalComponent } from './components/payment-details-modal/payment-details-modal.component';

@NgModule({
  declarations: [
    PaymentComponent,
    PaymentFormComponent,
    PaymentDetailsModalComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [PaymentComponent],
})
export class PaymentsModule {}
