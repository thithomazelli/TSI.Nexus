import { Routes } from '@angular/router';

import { UsersComponent } from './users.component';
import { UserDetailsPageComponent } from './components/user-details-page/user-details-page.component';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: UsersComponent,
        data: { roles: ['Admin', 'Master'] },
      },
      {
        path: 'new',
        component: UserDetailsPageComponent,
        data: { roles: ['Admin', 'Master'] },
      },
      {
        path: ':id',
        component: UserDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];