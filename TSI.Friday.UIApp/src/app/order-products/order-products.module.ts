import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AddressModule } from '../address/address.module';
import { OrderProductsRoutingModule } from './order-products-routing.module';
import { SharedModule } from '../shared/shared.module';
import { OrderProductsSharedModule } from './order-products-shared.module';

@NgModule({
  declarations: [],
  imports: [
    OrderProductsSharedModule,
    OrderProductsRoutingModule,
    CommonModule,
    AddressModule,
    SharedModule,
  ],
  exports: [],
})
export class OrderProductsModule {}
