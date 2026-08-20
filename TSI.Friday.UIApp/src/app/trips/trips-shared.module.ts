import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripsComponent } from './trips.component';
import { TripDetailsModalComponent } from './components/trip-details-modal/trip-details-modal.component';
import { TripFormComponent } from './components/trip-form/trip-form.component';
import { SharedModule } from '../shared/shared.module';
import { TransactionsSharedModule } from '../transactions/transactions-shared.module';
import { DriversSharedModule } from '../drivers/drivers-shared.module';

@NgModule({
  declarations: [TripsComponent, TripDetailsModalComponent, TripFormComponent],
  imports: [
    CommonModule,
    SharedModule,
    TransactionsSharedModule,
    DriversSharedModule,
  ],
  exports: [
    TripsComponent,
    TripDetailsModalComponent,
    TripFormComponent,
    SharedModule,
    DriversSharedModule,
  ],
})
export class TripsSharedModule {}
