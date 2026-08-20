import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OrderProductsRoutingModule } from './order-products.routes';
import { SharedModule } from '../shared/shared.module';
import { OrderProductsSharedModule } from './order-products-shared.module';

@NgModule({
  declarations: [],
  imports: [
    OrderProductsSharedModule,
    OrderProductsRoutingModule,
    CommonModule,
    SharedModule,
  ],
  exports: [],
})
export class OrderProductsModule {}
