import { Component, ElementRef, Inject } from '@angular/core';
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

  // Fixed, deliberately-smaller-than-the-canvas frame: without a static size
  // the crop box grows to fill almost the entire wrapper immediately, leaving
  // no visible margin for allowMoveImage's outside-the-box drag to ever land on.
  readonly frameSize = 300;

  private readonly minZoom = 1;
  private readonly maxZoom = 3;
  private readonly zoomStep = 0.25;
  private croppedBlob: Blob | null = null;

  // The photo's own on-screen size (in CSS px) at scale 1, captured once it
  // loads - used to convert the library's percentage-based translateH/V into
  // pan bounds that keep the frame fully covered by the image (see
  // clampTransform below).
  private baseImgWidth = 0;
  private baseImgHeight = 0;

  constructor(
    public dialogRef: MatDialogRef<ImageCropModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: ImageCropModalData,
    private readonly elementRef: ElementRef<HTMLElement>,
  ) {
    this.source = dialogData.source;
  }

  // ngx-image-cropper's drag-to-pan (allowMoveImage) applies translateH/V with
  // no bounds check at all - dragging just keeps adding the raw mouse delta,
  // so without this the photo can be dragged arbitrarily far until it's
  // completely off-screen and unreachable. imageLoaded fires once the photo
  // renders at scale 1/no pan, which is exactly when its rendered box size
  // (needed by clampTransform) can be measured.
  onImageLoaded(): void {
    setTimeout(() => {
      const img = this.elementRef.nativeElement.querySelector('.ngx-ic-source-image');
      if (img) {
        const rect = img.getBoundingClientRect();
        this.baseImgWidth = rect.width;
        this.baseImgHeight = rect.height;
      }
    });
  }

  // Fires on every crop-area interaction (drag, resize, zoom) since autoCrop
  // defaults to true - we just cache the latest result, the user only commits
  // it by clicking "Definir nova foto".
  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  // allowMoveImage lets the user drag the photo (outside the crop box) to pan
  // it, which the library reports back only through this event - we must fold
  // it into `transform`, or the next zoom change (which spreads `transform`)
  // would silently reset the user's pan back to center.
  onTransformChange(transform: ImageTransform): void {
    this.transform = this.clampTransform(transform);
    this.zoom = this.transform.scale ?? this.zoom;
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

  onZoomStep(direction: 1 | -1): void {
    this.setZoom(this.zoom + direction * this.zoomStep);
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
    // Re-clamp on every zoom change too, not just after a drag: zooming back
    // out shrinks the image, so a pan that was valid at a higher zoom can
    // leave the frame partially uncovered once the image is smaller again.
    this.transform = this.clampTransform({ ...this.transform, scale: this.zoom });
  }

  // Keeps the crop frame fully covered by the image: translateH/V are
  // percentages of the image's own unscaled box (baseImgWidth/Height), so the
  // max allowed pan at a given zoom is half the overflow beyond the frame,
  // expressed in that same percentage space.
  private clampTransform(transform: ImageTransform): ImageTransform {
    if (!this.baseImgWidth || !this.baseImgHeight) {
      return transform;
    }
    const scale = transform.scale ?? this.zoom;
    const maxH = Math.max(0, 50 * (scale - this.frameSize / this.baseImgWidth));
    const maxV = Math.max(0, 50 * (scale - this.frameSize / this.baseImgHeight));
    const translateH = Math.min(maxH, Math.max(-maxH, transform.translateH ?? 0));
    const translateV = Math.min(maxV, Math.max(-maxV, transform.translateV ?? 0));
    return { ...transform, translateH, translateV };
  }
}
