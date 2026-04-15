import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuoteDetailsPageComponent } from './components/quote-details-page/quote-details-page.component';

import { NgxMaskDirective } from 'ngx-mask';
import { ProductsModule } from '../products/products.module';
import { PaymentsModule } from '../payments/payments.module';

import { BusinessPartnerSharedModule } from '../business-partner/business-partner-shared.module';

import { TransactionsSharedModule } from '../transactions/transactions-shared.module';
import { QuoteProductsSharedModule } from '../quote-products/quote-products-shared.module';
import { QuotesSharedModule } from './quotes-shared.module';
import { QuotesRoutingModule } from './quotes-routing.module';

@NgModule({
  declarations: [QuoteDetailsPageComponent],
  imports: [
    QuotesSharedModule,
    QuotesRoutingModule,
    CommonModule,
    NgxMaskDirective,
    BusinessPartnerSharedModule,
    ProductsModule,
    TransactionsSharedModule,
    PaymentsModule,
    QuoteProductsSharedModule,
  ],
  exports: [],
})
export class QuotesModule {}
