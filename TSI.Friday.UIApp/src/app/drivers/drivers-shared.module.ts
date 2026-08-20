import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriverFormComponent } from './components/driver-form/driver-form.component';
import { DriverDetailsModalComponent } from './components/driver-details-modal/driver-details-modal.component';
import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';

@NgModule({
  declarations: [DriverFormComponent, DriverDetailsModalComponent],
  imports: [CommonModule, SharedModule, NgxMaskDirective],
  exports: [
    DriverFormComponent,
    DriverDetailsModalComponent,
    SharedModule,
    NgxMaskDirective,
  ],
})
export class DriversSharedModule {}
