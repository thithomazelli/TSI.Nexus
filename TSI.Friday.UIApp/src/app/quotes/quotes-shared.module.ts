import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { QuoteFormComponent } from './components/quote-form/quote-form.component';
import { QuoteDetailsModalComponent } from './components/quote-details-modal/quote-details-modal.component';
import { QuotesComponent } from './quotes.component';

@NgModule({
    imports: [CommonModule, SharedModule, QuotesComponent,
        QuoteDetailsModalComponent,
        QuoteFormComponent],
    exports: [
        QuotesComponent,
        QuoteDetailsModalComponent,
        QuoteFormComponent,
        SharedModule,
    ],
})
export class QuotesSharedModule {}
