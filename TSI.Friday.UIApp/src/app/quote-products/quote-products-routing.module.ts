import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuoteProductsComponent } from './quote-products.component';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuoteProductsRoutingModule {}
