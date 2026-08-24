import { Routes } from '@angular/router';

import { VehiclesComponent } from './vehicles.component';
import { VehicleDetailsPageComponent } from './components/vehicle-details-page/vehicle-details-page.component';

export const VEHICLES_ROUTES: Routes = [
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