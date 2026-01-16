import { MatDialogModule } from '@angular/material/dialog';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ValidationMessagesComponent } from './components/errors/validation-messages/validation-messages.component';
import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationComponent } from './components/modals/notification/notification.component';
import { GridComponent } from './grid/grid.component';
import { ConfirmationComponent } from './components/modals/confirmation/confirmation.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { PhotoComponent } from './photo/photo.component';

@NgModule({
  declarations: [
    NotFoundComponent,
    ValidationMessagesComponent,
    FooterComponent,
    NavbarComponent,
    NotificationComponent,
    GridComponent,
    ConfirmationComponent,
    SidebarComponent,
    HeaderComponent,
    PhotoComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AgGridModule,
    MatDialogModule,
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    RouterModule,
    MatDialogModule,
    ReactiveFormsModule,
    ValidationMessagesComponent,
    GridComponent,
    HeaderComponent,
    PhotoComponent,
    MatDialogModule,
  ],
})
export class SharedModule {}
