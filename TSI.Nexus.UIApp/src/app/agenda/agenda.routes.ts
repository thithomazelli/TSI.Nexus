import { Routes } from '@angular/router';

import { AgendaComponent } from './agenda.component';

export const AGENDA_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: AgendaComponent,
      },
    ],
  },
];
