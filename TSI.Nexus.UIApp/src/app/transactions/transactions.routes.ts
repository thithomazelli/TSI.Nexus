import { Routes } from '@angular/router';
import { TransactionsComponent } from './transactions.component';
import { TransactionDetailsPageComponent } from './components/transaction-details-page/transaction-details-page.component';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    data: { roles: ['Admin', 'Master'] },
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