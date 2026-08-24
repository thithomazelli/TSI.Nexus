import { Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { FleetReportComponent } from './components/fleet-report/fleet-report.component';

export const REPORTS_ROUTES: Routes = [
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