import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsComponent } from './products.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductDetailsModalComponent } from './components/product-details-modal/product-details-modal.component';
import { ProductDetailsPageComponent } from './components/product-details-page/product-details-page.component';

import { ProductsRoutingModule } from './products-routing.module';
import { SharedModule } from '../shared/shared.module';
import { OrderProductsSharedModule } from '../order-products/order-products-shared.module';

@NgModule({
  declarations: [
    ProductsComponent,
    ProductFormComponent,
    ProductDetailsModalComponent,
    ProductDetailsPageComponent,
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    SharedModule,
    OrderProductsSharedModule,
  ],
})
export class ProductsModule {}
