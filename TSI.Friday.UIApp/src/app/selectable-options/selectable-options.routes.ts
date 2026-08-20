import { Routes } from '@angular/router';

import { SelectableOptionsComponent } from './selectable-options.component';

export const SELECTABLE_OPTIONS_ROUTES: Routes = [
  {
    path: '',
    component: SelectableOptionsComponent,
    data: { roles: ['Admin', 'Master'] },
  },
];