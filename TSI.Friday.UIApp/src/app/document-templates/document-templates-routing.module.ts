import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocumentTemplatesComponent } from './document-templates.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentTemplatesComponent,
    data: { roles: ['Admin'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentTemplatesRoutingModule {}
