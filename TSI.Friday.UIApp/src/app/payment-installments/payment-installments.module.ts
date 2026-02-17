import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { PaymentInstallmentsComponent } from './payment-installments.component';
import { PaymentInstallmentFormComponent } from './components/payment-installment-form/payment-installment-form.component';
import { PaymentInstallmentDetailsModalComponent } from './components/payment-installment-details-modal/payment-installment-details-modal.component';

@NgModule({
  declarations: [
    PaymentInstallmentsComponent,
    PaymentInstallmentFormComponent,
    PaymentInstallmentDetailsModalComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [PaymentInstallmentsComponent],
})
export class PaymentInstallmentsModule {}
