import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OrdersComponent } from './orders.component';
import { OrderDetailsPageComponent } from './components/order-details-page/order-details-page.component';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersRoutingModule {}
