import { Routes } from '@angular/router';

import { OrdersComponent } from './orders.component';
import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: OrdersComponent,
      },
      {
        path: 'new',
        component: OrderDetailsPageComponent,
      },
      {
        path: ':id',
        component: OrderDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];