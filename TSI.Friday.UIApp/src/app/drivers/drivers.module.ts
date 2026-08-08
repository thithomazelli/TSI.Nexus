import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DriversComponent } from './drivers.component';
import { DriverFormComponent } from './components/driver-form/driver-form.component';
import { DriverDetailsPageComponent } from './components/driver-details-page/driver-details-page.component';
import { ServiceOrderListComponent } from './components/service-order-list/service-order-list.component';

import { DriversRoutingModule } from './drivers-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    DriversComponent,
    DriverFormComponent,
    DriverDetailsPageComponent,
    ServiceOrderListComponent,
  ],
  imports: [CommonModule, DriversRoutingModule, SharedModule],
})
export class DriversModule {}
