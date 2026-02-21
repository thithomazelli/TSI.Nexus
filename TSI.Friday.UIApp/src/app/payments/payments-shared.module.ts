import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetailsModalComponent } from './components/payment-details-modal/payment-details-modal.component';
import { PaymentFormComponent } from './components/payment-form/payment-form.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [PaymentDetailsModalComponent, PaymentFormComponent],
  imports: [CommonModule, SharedModule],
  exports: [PaymentDetailsModalComponent, PaymentFormComponent, SharedModule],
})
export class PaymentsSharedModule {}
