import { Routes } from '@angular/router';

import { FeatureTogglesComponent } from './feature-toggles.component';

export const FEATURE_TOGGLES_ROUTES: Routes = [
  {
    path: '',
    component: FeatureTogglesComponent,
    data: { roles: ['Master'] },
  },
];