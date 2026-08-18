import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AlertConfigsComponent } from './alert-configs.component';

const routes: Routes = [
  {
    path: '',
    component: AlertConfigsComponent,
    data: { roles: ['Master'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AlertConfigsRoutingModule {}
