import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DriversComponent } from './drivers.component';
import { DriverDetailsPageComponent } from './components/driver-details-page/driver-details-page.component';
import { ServiceOrderListComponent } from './components/service-order-list/service-order-list.component';

import { DriversRoutingModule } from './drivers-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';
import { DriversSharedModule } from './drivers-shared.module';
import { TripsSharedModule } from '../trips/trips-shared.module';
import { PaymentsModule } from '../payments/payments.module';

@NgModule({
  declarations: [
    DriversComponent,
    DriverDetailsPageComponent,
    ServiceOrderListComponent,
  ],
  imports: [
    CommonModule,
    DriversRoutingModule,
    SharedModule,
    NgxMaskDirective,
    DriversSharedModule,
    TripsSharedModule,
    PaymentsModule,
  ],
})
export class DriversModule {}
