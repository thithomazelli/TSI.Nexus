import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehiclesComponent } from './vehicles.component';
import { VehicleFormComponent } from './components/vehicle-form/vehicle-form.component';
import { VehicleDetailsPageComponent } from './components/vehicle-details-page/vehicle-details-page.component';

import { VehiclesRoutingModule } from './vehicles-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    VehiclesComponent,
    VehicleFormComponent,
    VehicleDetailsPageComponent,
  ],
  imports: [CommonModule, VehiclesRoutingModule, SharedModule],
})
export class VehiclesModule {}
