import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentTemplatesComponent } from './document-templates.component';
import { DocumentTemplatesRoutingModule } from './document-templates-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [DocumentTemplatesComponent],
  imports: [CommonModule, DocumentTemplatesRoutingModule, SharedModule],
})
export class DocumentTemplatesModule {}
