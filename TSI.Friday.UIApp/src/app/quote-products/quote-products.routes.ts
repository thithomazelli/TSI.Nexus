import { Routes } from '@angular/router';
import { QuoteProductsComponent } from './quote-products.component';

export const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: QuoteProductsComponent,
      },
    ],
  },
];