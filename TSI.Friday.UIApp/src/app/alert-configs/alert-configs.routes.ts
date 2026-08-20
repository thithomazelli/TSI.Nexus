import { Routes } from '@angular/router';

import { AlertConfigsComponent } from './alert-configs.component';

export const ALERT_CONFIGS_ROUTES: Routes = [
  {
    path: '',
    component: AlertConfigsComponent,
    data: { roles: ['Master'] },
  },
];