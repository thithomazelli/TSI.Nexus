import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { OrderProductsComponent } from './order-products.component';
import { OrderProductsDetailsModalComponent } from './component/order-product-details-modal/order-products-details-modal.component';
import { OrderProductsFormComponent } from './component/order-product-form/order-products-form.component';

@NgModule({
  declarations: [
    OrderProductsComponent,
    OrderProductsDetailsModalComponent,
    OrderProductsFormComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [OrderProductsComponent],
})
export class OrderProductsModule {}
