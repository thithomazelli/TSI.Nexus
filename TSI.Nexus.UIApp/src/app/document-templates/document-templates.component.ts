import { Component, OnInit } from '@angular/core';
import {
  DocumentTemplate,
  DocumentTemplateService,
  DocumentTemplateType,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../shared/header/header.component';
import { NgIf, NgFor } from '@angular/common';
import { TranslatePipe } from '../core/pipes/translate.pipe';

@Component({
    selector: 'app-document-templates',
    templateUrl: './document-templates.component.html',
    styleUrl: './document-templates.component.scss',
    imports: [
        HeaderComponent,
        NgIf,
        NgFor,
        TranslatePipe,
    ],
})
export class DocumentTemplatesComponent implements OnInit {
  templates: DocumentTemplate[] = [];
  loading = false;
  uploadingType: DocumentTemplateType | null = null;

  constructor(
    private documentTemplateService: DocumentTemplateService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  download(template: DocumentTemplate): void {
    if (!template.type) {
      return;
    }
    this.documentTemplateService.download(template.type).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = template.fileName || `${template.type}.html`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  }

  triggerUpload(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event, template: DocumentTemplate): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file || !template.type) {
      return;
    }

    this.uploadingType = template.type;
    this.documentTemplateService
      .upload(template.type, file)
      .pipe(finalize(() => (this.uploadingType = null)))
      .subscribe({
        next: (response) => {
          if (response.status === ResponseStatus.Success && response.data) {
            template.fileName = response.data.fileName;
            template.content = response.data.content;
          }
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        },
        error: () => {
          this.notificationService.showMessage(
            'Error',
            this.translationService.instant('DOCUMENT_TEMPLATES.UPDATE_ERROR'),
          );
        },
      });
  }

  private load(): void {
    this.loading = true;
    this.documentTemplateService.getAll().subscribe({
      next: (response) => {
        this.templates = response.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
