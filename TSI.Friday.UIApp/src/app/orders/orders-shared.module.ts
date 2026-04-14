import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersComponent } from './orders.component';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { SharedModule } from '../shared/shared.module';
import { TransactionsSharedModule } from '../transactions/transactions-shared.module';

@NgModule({
  declarations: [
    OrdersComponent,
    OrderDetailsModalComponent,
    OrderFormComponent,
  ],
  imports: [CommonModule, SharedModule, TransactionsSharedModule],
  exports: [
    OrdersComponent,
    OrderDetailsModalComponent,
    OrderFormComponent,
    SharedModule,
  ],
})
export class OrdersSharedModule {}
