import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientDetailsModalComponent } from './components/client-details-modal/client-details-modal.component';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { AddressModule } from '../address/address.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ClientDetailsModalComponent, ClientFormComponent],
  imports: [CommonModule, SharedModule, AddressModule],
  exports: [ClientDetailsModalComponent, ClientFormComponent, SharedModule],
})
export class ClientsSharedModule {}
