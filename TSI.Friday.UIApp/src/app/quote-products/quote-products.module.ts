import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { QuoteProductsRoutingModule } from './quote-products-routing.module';
import { SharedModule } from '../shared/shared.module';
import { QuoteProductsSharedModule } from './quote-products-shared.module';

@NgModule({
  declarations: [],
  imports: [
    QuoteProductsSharedModule,
    QuoteProductsRoutingModule,
    CommonModule,
    SharedModule,
  ],
  exports: [],
})
export class QuoteProductsModule {}
