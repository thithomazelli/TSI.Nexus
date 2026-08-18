import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgApexchartsModule } from 'ng-apexcharts';

import { MAT_DATE_LOCALE } from '@angular/material/core';

import { MY_DATE_FORMATS } from '../core/br-date-format';

import * as _moment from 'moment';
import 'moment/locale/pt-br';

_moment.updateLocale('pt-br', {
  weekdaysShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  weekdaysMin: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
});
_moment.locale('pt-br');

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ValidationMessagesComponent } from './components/errors/validation-messages/validation-messages.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationComponent } from './components/modals/notification/notification.component';
import { GridComponent } from './grid/grid.component';
import { ConfirmationComponent } from './components/modals/confirmation/confirmation.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { PhotoComponent } from './photo/photo.component';
import { DateFieldComponent } from './components/date-field/date-field.component';
import { LinkFieldComponent } from './components/link-field/link-field.component';
import { AreaChartComponent } from './area-chart/area-chart.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { AreaChartTrendingComponent } from './area-chart-trending/area-chart-trending.component';
import { AlertBannerComponentComponent } from './alert-banner-component/alert-banner-component.component';
import { InfoCardsComponent } from './info-cards/info-cards.component';
import { ClickDirective, TranslatePipe } from '@friday/core';
import { AttachmentsComponent } from './attachments/attachments.component';
import { AttachmentDetailsModalComponent } from './attachments/components/attachment-details-modal/attachment-details-modal.component';
import { UserPreferencesComponent } from './components/user-preferences/user-preferences.component';

import { Tree } from 'primeng/tree';
import { ContextMenu } from 'primeng/contextmenu';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { FileUpload } from 'primeng/fileupload';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';

@NgModule({
  declarations: [
    AttachmentsComponent,
    AttachmentDetailsModalComponent,
    DateFieldComponent,
    NotFoundComponent,
    ValidationMessagesComponent,
    FooterComponent,
    NotificationComponent,
    GridComponent,
    ConfirmationComponent,
    SidebarComponent,
    HeaderComponent,
    PhotoComponent,
    LinkFieldComponent,
    PieChartComponent,
    AreaChartComponent,
    AreaChartTrendingComponent,
    AlertBannerComponentComponent,
    InfoCardsComponent,
    UserPreferencesComponent,
  ],
  imports: [
    ClickDirective,
    TranslatePipe,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    AgGridModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMomentDateModule,
    NgApexchartsModule,
    Tree,
    ContextMenu,
    Dialog,
    Button,
    InputText,
    FileUpload,
    ConfirmDialog,
    Tooltip,
  ],
  exports: [
    AttachmentsComponent,
    AttachmentDetailsModalComponent,
    ClickDirective,
    TranslatePipe,
    DateFieldComponent,
    LinkFieldComponent,
    SidebarComponent,
    PieChartComponent,
    AreaChartComponent,
    AreaChartTrendingComponent,
    AlertBannerComponentComponent,
    InfoCardsComponent,
    UserPreferencesComponent,
    NotificationComponent,
    FooterComponent,
    RouterModule,
    MatDialogModule,
    ReactiveFormsModule,
    ValidationMessagesComponent,
    GridComponent,
    HeaderComponent,
    PhotoComponent,
    MatDialogModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgApexchartsModule,
    FormsModule,
    Tree,
    ContextMenu,
    Dialog,
    Button,
    InputText,
    FileUpload,
    ConfirmDialog,
    Tooltip,
  ],
  providers: [
    ConfirmationService,
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
})
export class SharedModule {}
