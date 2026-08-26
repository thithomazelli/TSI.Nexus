import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageTransform,
} from 'ngx-image-cropper';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

export interface ImageCropModalData {
  source: File;
}

@Component({
  selector: 'app-image-crop-modal',
  templateUrl: './image-crop-modal.component.html',
  styleUrl: './image-crop-modal.component.scss',
  imports: [ImageCropperComponent, TranslatePipe],
})
export class ImageCropModalComponent {
  source: File;
  transform: ImageTransform = { scale: 1 };
  zoom = 1;

  private readonly minZoom = 1;
  private readonly maxZoom = 3;
  private croppedBlob: Blob | null = null;

  constructor(
    public dialogRef: MatDialogRef<ImageCropModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: ImageCropModalData,
  ) {
    this.source = dialogData.source;
  }

  // Fires on every crop-area interaction (drag, resize, zoom) since autoCrop
  // defaults to true - we just cache the latest result, the user only commits
  // it by clicking "Definir nova foto".
  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  onZoomChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.setZoom(value);
  }

  onWheelZoom(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.05 : -0.05;
    this.setZoom(this.zoom + delta);
  }

  confirm(): void {
    if (!this.croppedBlob) return;
    this.dialogRef.close(this.croppedBlob);
  }

  close(): void {
    this.dialogRef.close();
  }

  private setZoom(value: number): void {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, value));
    this.transform = { ...this.transform, scale: this.zoom };
  }
}
