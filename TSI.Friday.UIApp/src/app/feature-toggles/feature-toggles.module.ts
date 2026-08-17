import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatureTogglesComponent } from './feature-toggles.component';
import { FeatureTogglesRoutingModule } from './feature-toggles-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [FeatureTogglesComponent],
  imports: [CommonModule, FeatureTogglesRoutingModule, SharedModule],
})
export class FeatureTogglesModule {}
