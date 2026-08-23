import { Routes } from '@angular/router';

import { PurchaseOrdersComponent } from './purchase-orders.component';
import { PurchaseOrderDetailsPageComponent } from './components/purchase-order-details-page/purchase-order-details-page.component';

export const PURCHASE_ORDERS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: PurchaseOrdersComponent,
      },
      {
        path: 'new',
        component: PurchaseOrderDetailsPageComponent,
      },
      {
        path: ':id',
        component: PurchaseOrderDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];
