import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersComponent } from './users.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailsModalComponent } from './components/user-details-modal/user-details-modal.component';
import { UserDetailsPageComponent } from './components/user-details-page/user-details-page.component';

import { UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    UsersComponent,
    UserFormComponent,
    UserDetailsModalComponent,
    UserDetailsPageComponent,
  ],
  imports: [CommonModule, UsersRoutingModule, SharedModule],
})
export class UsersModule {}
