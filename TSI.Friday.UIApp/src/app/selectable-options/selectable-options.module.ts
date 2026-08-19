import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SelectableOptionsComponent } from './selectable-options.component';
import { SelectableOptionsRoutingModule } from './selectable-options-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [SelectableOptionsComponent],
  imports: [CommonModule, FormsModule, SelectableOptionsRoutingModule, SharedModule],
})
export class SelectableOptionsModule {}
