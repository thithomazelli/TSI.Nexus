import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { FleetReportComponent } from './components/fleet-report/fleet-report.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    component: ReportsComponent,
    data: { roles: ['Admin', 'Master'] },
  },
  {
    path: 'fleet',
    runGuardsAndResolvers: 'always',
    component: FleetReportComponent,
    data: { roles: ['Admin', 'Master'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
