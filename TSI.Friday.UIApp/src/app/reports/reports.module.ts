import { NgModule } from '@angular/core';
import { ReportsComponent } from './reports.component';
import { FleetReportComponent } from './components/fleet-report/fleet-report.component';
import { CommonModule } from '@angular/common';
import { ReportsRoutingModule } from './reports-routing.module';
import { SharedModule } from '../shared/shared.module';
import { PaymentsModule } from '../payments/payments.module';

@NgModule({
  declarations: [ReportsComponent, FleetReportComponent],
  imports: [CommonModule, ReportsRoutingModule, SharedModule, PaymentsModule],
})
export class ReportsModule {}
