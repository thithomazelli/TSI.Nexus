import { Routes } from '@angular/router';
import { OrderProductsComponent } from './order-products.component';

export const ORDER_PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: OrderProductsComponent,
      },
    ],
  },
];