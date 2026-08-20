import { Routes } from '@angular/router';
import { QuotesComponent } from './quotes.component';
import { QuoteDetailsPageComponent } from './components/quote-details-page/quote-details-page.component';

export const QUOTES_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: QuotesComponent,
      },
      {
        path: 'new',
        component: QuoteDetailsPageComponent,
      },
      {
        path: ':id',
        component: QuoteDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];