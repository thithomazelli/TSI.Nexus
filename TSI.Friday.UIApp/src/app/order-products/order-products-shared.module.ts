import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AddressModule } from '../address/address.module';
import { OrderProductsComponent } from './order-products.component';
import { OrderProductsFormComponent } from './components/order-product-form/order-products-form.component';
import { OrderProductsDetailsModalComponent } from './components/order-product-details-modal/order-products-details-modal.component';

@NgModule({
  declarations: [
    OrderProductsComponent,
    OrderProductsDetailsModalComponent,
    OrderProductsFormComponent,
  ],
  imports: [CommonModule, SharedModule, AddressModule],
  exports: [
    OrderProductsComponent,
    OrderProductsDetailsModalComponent,
    OrderProductsFormComponent,
  ],
})
export class OrderProductsSharedModule {}
