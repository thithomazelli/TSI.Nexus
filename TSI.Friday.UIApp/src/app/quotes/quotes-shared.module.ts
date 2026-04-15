import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { QuoteFormComponent } from './components/quote-form/quote-form.component';
import { QuoteDetailsModalComponent } from './components/quote-details-modal/quote-details-modal.component';
import { QuotesComponent } from './quotes.component';

@NgModule({
  declarations: [
    QuotesComponent,
    QuoteDetailsModalComponent,
    QuoteFormComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    QuotesComponent,
    QuoteDetailsModalComponent,
    QuoteFormComponent,
    SharedModule,
  ],
})
export class QuotesSharedModule {}
