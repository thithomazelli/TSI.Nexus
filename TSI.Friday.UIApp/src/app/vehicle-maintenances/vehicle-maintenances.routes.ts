import { Routes } from '@angular/router';
import { VehicleMaintenanceListComponent } from '../vehicles/components/vehicle-maintenance-list/vehicle-maintenance-list.component';
import { VehicleMaintenanceDetailsPageComponent } from '../vehicles/components/vehicle-maintenance-details-page/vehicle-maintenance-details-page.component';

export const VEHICLE_MAINTENANCES_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: VehicleMaintenanceListComponent,
      },
      {
        path: ':id',
        component: VehicleMaintenanceDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];
