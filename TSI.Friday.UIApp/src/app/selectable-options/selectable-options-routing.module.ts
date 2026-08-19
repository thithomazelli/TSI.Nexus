import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SelectableOptionsComponent } from './selectable-options.component';

const routes: Routes = [
  {
    path: '',
    component: SelectableOptionsComponent,
    data: { roles: ['Admin', 'Master'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectableOptionsRoutingModule {}
