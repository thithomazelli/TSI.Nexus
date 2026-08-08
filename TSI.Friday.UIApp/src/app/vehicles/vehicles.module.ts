import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehiclesComponent } from './vehicles.component';
import { VehicleFormComponent } from './components/vehicle-form/vehicle-form.component';
import { VehicleDetailsPageComponent } from './components/vehicle-details-page/vehicle-details-page.component';
import { VehicleMaintenanceListComponent } from './components/vehicle-maintenance-list/vehicle-maintenance-list.component';

import { VehiclesRoutingModule } from './vehicles-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    VehiclesComponent,
    VehicleFormComponent,
    VehicleDetailsPageComponent,
    VehicleMaintenanceListComponent,
  ],
  imports: [CommonModule, VehiclesRoutingModule, SharedModule],
})
export class VehiclesModule {}
