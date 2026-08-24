import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionsComponent } from './transactions.component';
import { TransactionDetailsPageComponent } from './components/transaction-details-page/transaction-details-page.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    data: { roles: ['Admin'] },
    children: [
      {
        path: '',
        component: TransactionsComponent,
      },
      {
        path: 'new',
        component: TransactionDetailsPageComponent,
      },
      {
        path: ':id',
        component: TransactionDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransactionsRoutingModule {}
