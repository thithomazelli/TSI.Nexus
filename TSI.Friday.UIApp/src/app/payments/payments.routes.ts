import { Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    data: { roles: ['Admin', 'Master'] },
    children: [
      {
        path: '',
        component: PaymentsComponent,
      },
    ],
  },
];