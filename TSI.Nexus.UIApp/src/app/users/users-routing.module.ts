import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UsersComponent } from './users.component';
import { UserDetailsPageComponent } from './components/user-details-page/user-details-page.component';

const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: '',
        component: UsersComponent,
        data: { roles: ['Admin'] },
      },
      {
        path: 'new',
        component: UserDetailsPageComponent,
        data: { roles: ['Admin'] },
      },
      {
        path: ':id',
        component: UserDetailsPageComponent,
        runGuardsAndResolvers: 'always',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersRoutingModule {}
