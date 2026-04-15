import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { QuoteProductsComponent } from './quote-products.component';
import { QuoteProductFormComponent } from './components/quote-product-form/quote-product-form.component';
import { QuoteProductDetailsModalComponent } from './components/quote-product-details-modal/quote-product-details-modal.component';

@NgModule({
  declarations: [
    QuoteProductsComponent,
    QuoteProductDetailsModalComponent,
    QuoteProductFormComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    QuoteProductsComponent,
    QuoteProductDetailsModalComponent,
    QuoteProductFormComponent,
  ],
})
export class QuoteProductsSharedModule {}
