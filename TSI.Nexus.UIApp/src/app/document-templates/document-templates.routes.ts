import { Routes } from '@angular/router';

import { DocumentTemplatesComponent } from './document-templates.component';

export const DOCUMENT_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    component: DocumentTemplatesComponent,
    data: { roles: ['Admin', 'Master'] },
  },
];