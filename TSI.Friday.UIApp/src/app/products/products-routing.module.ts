import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProductsComponent } from './products.component';
import { ProductDetailsPageComponent } from './components/product-details-page/product-details-page.component';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
