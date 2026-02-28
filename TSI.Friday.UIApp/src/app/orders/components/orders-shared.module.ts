import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';
import { OrderFormComponent } from './order-form/order-form.component';
import { TransactionsSharedModule } from '../../transactions/transactions-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { OrderProductsSharedModule } from '../../order-products/order-products-shared.module';

@NgModule({
  declarations: [OrderDetailsModalComponent, OrderFormComponent],
  imports: [CommonModule, SharedModule, TransactionsSharedModule],
  exports: [OrderDetailsModalComponent, OrderFormComponent, SharedModule],
})
export class OrdersSharedModule {}
