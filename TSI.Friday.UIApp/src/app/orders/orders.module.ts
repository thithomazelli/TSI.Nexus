import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersComponent } from './orders.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';

import { OrdersRoutingModule } from './orders-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    OrdersComponent,
    OrderFormComponent,
    OrderDetailsModalComponent,
    OrderDetailsPageComponent,
  ],
  imports: [CommonModule, OrdersRoutingModule, SharedModule],
})
export class OrdersModule {}
