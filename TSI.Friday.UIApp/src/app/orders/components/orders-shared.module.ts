import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';
import { OrderFormComponent } from './order-form/order-form.component';
import { PaymentsSharedModule } from '../../payments/payments-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { OrderProductsModule } from '../../order-products/order-products.module';

@NgModule({
  declarations: [OrderDetailsModalComponent, OrderFormComponent],
  imports: [
    CommonModule,
    SharedModule,
    OrderProductsModule,
    PaymentsSharedModule,
  ],
  exports: [OrderDetailsModalComponent, OrderFormComponent, SharedModule],
})
export class OrdersSharedModule {}
