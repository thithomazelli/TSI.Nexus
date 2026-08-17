import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FeatureTogglesComponent } from './feature-toggles.component';

const routes: Routes = [
  {
    path: '',
    component: FeatureTogglesComponent,
    data: { roles: ['Master'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeatureTogglesRoutingModule {}
