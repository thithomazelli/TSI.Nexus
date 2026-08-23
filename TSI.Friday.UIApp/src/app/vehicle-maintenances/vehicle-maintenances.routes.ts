import { Routes } from '@angular/router';
import { VehicleMaintenanceListComponent } from '../vehicles/components/vehicle-maintenance-list/vehicle-maintenance-list.component';

export const VEHICLE_MAINTENANCES_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: VehicleMaintenanceListComponent,
      },
    ],
  },
];
