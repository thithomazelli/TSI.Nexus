import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TripDetailsPageComponent } from './components/trip-details-page/trip-details-page.component';
import { TripLegListComponent } from './components/trip-leg-list/trip-leg-list.component';
import { TripLegDetailsModalComponent } from './components/trip-leg-details-modal/trip-leg-details-modal.component';
import { PassengerListComponent } from './components/passenger-list/passenger-list.component';
import { PassengerDetailsModalComponent } from './components/passenger-details-modal/passenger-details-modal.component';
import { PassengerImportComponent } from './components/passenger-import/passenger-import.component';
import { TripDriverListComponent } from './components/trip-driver-list/trip-driver-list.component';
import { TripDriverDetailsModalComponent } from './components/trip-driver-details-modal/trip-driver-details-modal.component';
import { TripDriverFormComponent } from './components/trip-driver-form/trip-driver-form.component';

import { TripsRoutingModule } from './trips-routing.module';
import { NgxMaskDirective } from 'ngx-mask';
import { PaymentsModule } from '../payments/payments.module';

import { BusinessPartnerSharedModule } from '../business-partner/business-partner-shared.module';

import { TransactionsSharedModule } from '../transactions/transactions-shared.module';
import { TripsSharedModule } from './trips-shared.module';

@NgModule({
  declarations: [
    TripDetailsPageComponent,
    TripLegListComponent,
    TripLegDetailsModalComponent,
    PassengerListComponent,
    PassengerDetailsModalComponent,
    PassengerImportComponent,
    TripDriverListComponent,
    TripDriverDetailsModalComponent,
    TripDriverFormComponent,
  ],
  imports: [
    TripsSharedModule,
    TripsRoutingModule,
    CommonModule,
    NgxMaskDirective,
    BusinessPartnerSharedModule,
    TransactionsSharedModule,
    PaymentsModule,
  ],
  exports: [],
})
export class TripsModule {}
