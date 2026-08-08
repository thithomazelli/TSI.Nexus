import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DriversComponent } from './drivers.component';
import { DriverDetailsPageComponent } from './components/driver-details-page/driver-details-page.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: DriversComponent,
      },
      {
        path: 'new',
        component: DriverDetailsPageComponent,
      },
      {
        path: ':id',
        component: DriverDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriversRoutingModule {}
