import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionDetailsModalComponent } from './components/transaction-details-modal/transaction-details-modal.component';
import { TransactionFormComponent } from './components/transactions-form/transaction-form.component';
import { SharedModule } from '../shared/shared.module';
import { TransactionsComponent } from './transactions.component';

@NgModule({
    imports: [CommonModule, SharedModule, TransactionsComponent,
        TransactionFormComponent,
        TransactionDetailsModalComponent,
        TransactionFormComponent],
    exports: [
        TransactionsComponent,
        TransactionFormComponent,
        TransactionDetailsModalComponent,
        TransactionFormComponent,
        SharedModule,
    ],
})
export class TransactionsSharedModule {}
