import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessPartnerDetailsModalComponent } from './components/business-partner-details-modal/business-partner-details-modal.component';
import { BusinessPartnerFormComponent } from './components/business-partner-form/business-partner-form.component';
import { AddressModule } from '../address/address.module';
import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';

@NgModule({
  declarations: [
    BusinessPartnerDetailsModalComponent,
    BusinessPartnerFormComponent,
  ],
  imports: [CommonModule, SharedModule, AddressModule, NgxMaskDirective],
  exports: [
    BusinessPartnerDetailsModalComponent,
    BusinessPartnerFormComponent,
    SharedModule,
    NgxMaskDirective,
  ],
})
export class BusinessPartnerSharedModule {}
