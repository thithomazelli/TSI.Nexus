import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VehiclesComponent } from './vehicles.component';
import { VehicleDetailsPageComponent } from './components/vehicle-details-page/vehicle-details-page.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: VehiclesComponent,
      },
      {
        path: 'new',
        component: VehicleDetailsPageComponent,
      },
      {
        path: ':id',
        component: VehicleDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VehiclesRoutingModule {}
