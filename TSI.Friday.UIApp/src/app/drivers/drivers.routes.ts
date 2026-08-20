import { Routes } from '@angular/router';

import { DriversComponent } from './drivers.component';
import { DriverDetailsPageComponent } from './components/driver-details-page/driver-details-page.component';

export const DRIVERS_ROUTING: Routes = [
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