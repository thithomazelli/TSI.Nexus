import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Attachment } from '@friday/core';

@Component({
  selector: 'app-attachment-details-modal',
  standalone: false,
  templateUrl: './attachment-details-modal.component.html',
  styleUrl: './attachment-details-modal.component.scss',
})
export class AttachmentDetailsModalComponent {
  @Input()
  attachment!: Attachment;

  @Input()
  currentPath = '';

  @Output() remove = new EventEmitter<Attachment>();
  @Output() download = new EventEmitter<Attachment>();

  isImage(): boolean {
    const ext =
      this.attachment?.fileName?.split('.').pop()?.toLowerCase() ?? '';
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  }
}
