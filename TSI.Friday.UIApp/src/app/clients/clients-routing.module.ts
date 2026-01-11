import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientsComponent } from './clients.component';
import { ClientDetailsPageComponent } from './components/client-details-page/client-details-page.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: ClientsComponent,
      },
      {
        path: 'new',
        component: ClientDetailsPageComponent,
      },
      {
        path: ':id',
        component: ClientDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientsRoutingModule {}
