import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehiclesComponent } from './vehicles.component';
import { VehicleFormComponent } from './components/vehicle-form/vehicle-form.component';
import { VehicleDetailsModalComponent } from './components/vehicle-details-modal/vehicle-details-modal.component';
import { VehicleDetailsPageComponent } from './components/vehicle-details-page/vehicle-details-page.component';
import { VehicleMaintenanceListComponent } from './components/vehicle-maintenance-list/vehicle-maintenance-list.component';
import { VehicleMaintenanceDetailsModalComponent } from './components/vehicle-maintenance-details-modal/vehicle-maintenance-details-modal.component';
import { FuelLogListComponent } from './components/fuel-log-list/fuel-log-list.component';
import { FuelLogDetailsModalComponent } from './components/fuel-log-details-modal/fuel-log-details-modal.component';

import { VehiclesRoutingModule } from './vehicles-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    VehiclesComponent,
    VehicleFormComponent,
    VehicleDetailsModalComponent,
    VehicleDetailsPageComponent,
    VehicleMaintenanceListComponent,
    VehicleMaintenanceDetailsModalComponent,
    FuelLogListComponent,
    FuelLogDetailsModalComponent,
  ],
  imports: [CommonModule, VehiclesRoutingModule, SharedModule],
})
export class VehiclesModule {}
