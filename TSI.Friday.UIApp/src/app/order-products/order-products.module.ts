import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AddressModule } from '../address/address.module';
import { OrderProductsComponent } from './order-products.component';
import { OrderProductsDetailsModalComponent } from './components/order-product-details-modal/order-products-details-modal.component';
import { OrderProductsFormComponent } from './components/order-product-form/order-products-form.component';

@NgModule({
  declarations: [
    OrderProductsComponent,
    OrderProductsDetailsModalComponent,
    OrderProductsFormComponent,
  ],
  imports: [CommonModule, SharedModule, AddressModule],
  exports: [OrderProductsComponent],
})
export class OrderProductsModule {}
