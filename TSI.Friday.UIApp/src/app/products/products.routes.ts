import { Routes } from '@angular/router';

import { ProductsComponent } from './products.component';
import { ProductDetailsPageComponent } from './components/product-details-page/product-details-page.component';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: ProductsComponent,
      },
      {
        path: 'new',
        component: ProductDetailsPageComponent,
      },
      {
        path: ':id',
        component: ProductDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];