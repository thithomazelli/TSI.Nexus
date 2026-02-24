import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { TransactionsRoutingModule } from './transaction-routing.module';
import { TransactionDetailsPageComponent } from './components/transaction-details-page/transaction-details-page.component';
import { TransactionsComponent } from './transactions.component';

import { TransactionsSharedModule } from './transactions-shared.module';
import { ClientsSharedModule } from '../clients/clients-shared.module';
import { PaymentsModule } from '../payments/payments.module';

@NgModule({
  declarations: [TransactionsComponent, TransactionDetailsPageComponent],
  imports: [
    TransactionsSharedModule,
    TransactionsRoutingModule,
    CommonModule,
    NgxMaskDirective,
    ClientsSharedModule,
    PaymentsModule,
  ],
  exports: [],
})
export class TransactionsModule {}
