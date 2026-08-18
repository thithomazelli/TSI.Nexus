import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertConfigsComponent } from './alert-configs.component';
import { AlertConfigsRoutingModule } from './alert-configs-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [AlertConfigsComponent],
  imports: [CommonModule, AlertConfigsRoutingModule, SharedModule],
})
export class AlertConfigsModule {}
