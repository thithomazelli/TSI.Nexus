import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuotesComponent } from './quotes.component';
import { QuoteDetailsPageComponent } from './components/quote-details-page/quote-details-page.component';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotesRoutingModule {}
