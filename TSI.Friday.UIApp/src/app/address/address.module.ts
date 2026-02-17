import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddressComponent } from './address.component';
import { AddressFormComponent } from './components/address-form/address-form.component';
import { AddressDetailsModalComponent } from './components/address-details-modal/address-details-modal.component';
import { AddressDetailsPageComponent } from './components/address-details-page/address-details-page.component';

import { SharedModule } from '../shared/shared.module';
import { NgxMaskDirective } from 'ngx-mask';

@NgModule({
  declarations: [
    AddressComponent,
    AddressFormComponent,
    AddressDetailsModalComponent,
    AddressDetailsPageComponent,
  ],
  imports: [CommonModule, SharedModule, NgxMaskDirective],
  exports: [AddressComponent, AddressFormComponent],
})
export class AddressModule {}
