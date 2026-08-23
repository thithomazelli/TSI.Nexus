import { Routes } from '@angular/router';
import { FuelLogListComponent } from '../vehicles/components/fuel-log-list/fuel-log-list.component';

export const FUEL_LOGS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: FuelLogListComponent,
      },
    ],
  },
];
