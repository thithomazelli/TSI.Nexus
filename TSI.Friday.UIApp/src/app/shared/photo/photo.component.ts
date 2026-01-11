import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  ApiService,
  Client,
  ModalService,
  PhotoType,
  Product,
  User,
  WebApiResponse,
} from '@friday/core';
import { ModalOptions } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
  standalone: false,
})
export class PhotoComponent implements OnInit, OnDestroy {
  @Input()
  baseEndPoint: string = '';

  @Input()
  data: Client | Product | User | null = null;

  @Input()
  imageUrl?: string | null = null;

  @Input()
  entityClass = 'produto';

  @Input()
  filenamePrefix?: string;

  @Input()
  placeholderIcon = true;

  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Output()
  imageChange = new EventEmitter<File | null>();

  @Output()
  imageSaved = new EventEmitter<{ file: File; filename: string }>();

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('videoEl')
  videoEl!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvasEl')
  canvasEl!: ElementRef<HTMLCanvasElement>;

  previewDataUrl?: string | null = null;
  cameraActive = false;
  private mediaStream?: MediaStream;
  private lastObjectUrl?: string;

  constructor(
    private cd: ChangeDetectorRef,
    private modalService: ModalService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.previewDataUrl = this.imageUrl ?? null;
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.revokeLastObjectUrl();
  }

  triggerFile(): void {
    this.fileInput?.nativeElement.click();
  }

  async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      // enable video placeholder in template so ViewChild is created
      this.cameraActive = true;
      this.previewDataUrl = null;
      this.cd.detectChanges(); // make Angular render the video element
      await Promise.resolve(); // allow microtask tick so ViewChild binds

      const videoElRef = this.videoEl?.nativeElement;
      if (!videoElRef) {
        console.warn('Video element not available after enabling camera');
        return;
      }

      videoElRef.srcObject = this.mediaStream;
      await videoElRef.play();
    } catch (err) {
      console.error('Camera start failed', err);
      this.stopCamera();
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = undefined;
    }
    try {
      if (this.videoEl && this.videoEl.nativeElement) {
        this.videoEl.nativeElement.pause();
        // detach stream to release camera
        try {
          (this.videoEl.nativeElement.srcObject as any) = null;
        } catch {}
      }
    } catch {}
    this.cameraActive = false;
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    this.revokeLastObjectUrl();
    const reader = new FileReader();
    reader.onload = () => {
      this.previewDataUrl = String(reader.result);
      const ext = '.' + this.getExtFromMime(file.type);
      const suggested = this.buildFilename(ext);

      if (this.baseEndPoint && this.data) {
        this.uploadAndUpdate(file, suggested);
      } else {
        this.emitFile(file, suggested);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  capturePhoto(): void {
    const video = this.videoEl?.nativeElement;
    const canvas = this.canvasEl?.nativeElement;
    if (!canvas || !video) {
      console.warn('Cannot capture: video or canvas not available');
      return;
    }
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    // Use data URL for immediate preview, and still create a blob to emit the file
    try {
      const dataUrl = canvas.toDataURL('image/png');

      // revoke previous object URL to avoid leaks
      this.revokeLastObjectUrl();
      this.previewDataUrl = dataUrl;

      // emit a blob/file asynchronously
      canvas.toBlob((blob) => {
        if (!blob) return;
        const ext = blob.type.split('/').pop() ?? 'png';
        const baseName = this.filenamePrefix
          ? `${this.filenamePrefix}_${Date.now()}`
          : `img_${Date.now()}`;
        const suggested = `${this.entityClass}/${baseName}.${ext}`;
        const file = new File([blob], baseName + '.' + ext, {
          type: blob.type,
        });

        if (this.baseEndPoint && this.data) {
          this.uploadAndUpdate(file, suggested);
        } else {
          this.emitFile(file, suggested);
        }
      }, 'image/png');

      // ensure view updates immediately and stop camera so preview is visible
      this.cd.detectChanges();
      this.stopCamera();
    } catch (err) {
      console.error('capturePhoto failed', err);
      this.stopCamera();
    }
  }

  removePhoto(): void {
    this.previewDataUrl = null;
    this.imageChange.emit(null);
    this.imageSaved.emit({ file: null as any, filename: '' });
    this.revokeLastObjectUrl();

    // update backend mainPhoto if context provided
    if (this.baseEndPoint && this.data) {
      try {
        (this.data as any).mainPhoto = '';
      } catch {}
      this.updateMainPhotoAndNotify('');
    }

    this.stopCamera();
  }

  private emitFile(file: File, filename: string): void {
    this.imageChange.emit(file);
    this.imageSaved.emit({ file, filename });
  }

  private buildFilename(extWithDot = '.png'): string {
    const base = this.filenamePrefix
      ? `${this.filenamePrefix}_${Date.now()}`
      : `img_${Date.now()}`;
    return `${this.entityClass}/${base}${extWithDot}`;
  }

  private getExtFromMime(mime: string): string {
    const parts = mime.split('/');
    return parts.length > 1 ? parts[1] : 'png';
  }

  private revokeLastObjectUrl(): void {
    if (this.lastObjectUrl) {
      try {
        URL.revokeObjectURL(this.lastObjectUrl);
      } catch {}
      this.lastObjectUrl = undefined;
    }
  }

  private uploadAndUpdate(file: File, suggestedFilename: string): void {
    const fd = new FormData();
    fd.append('file', file);
    if (this.data && (this.data as any).id) {
      fd.append('id', String((this.data as any).id));
    }

    const uploadEndpoint = `${this.baseEndPoint}/uploadImage`;

    this.apiService.post<any>(uploadEndpoint, fd).subscribe(
      (resp) => {
        let filename = suggestedFilename;
        try {
          if (resp && resp.data) {
            filename = resp.data.filename ?? resp.data.mainPhoto ?? resp.data;
          } else if (resp && resp.filename) {
            filename = resp.filename;
          }
        } catch {}

        this.updateMainPhotoAndNotify(filename);
        this.emitFile(file, filename);
      },
      () => {
        this.updateMainPhotoAndNotify(suggestedFilename);
        this.emitFile(file, suggestedFilename);
      }
    );
  }

  private updateMainPhotoAndNotify(filename: string): void {
    if (!this.data || !this.baseEndPoint) return;

    try {
      (this.data as any).mainPhoto = filename;
    } catch {}

    const updateEndpoint = `${this.baseEndPoint}/update`;
    this.apiService
      .put<WebApiResponse<any>>(updateEndpoint, this.data)
      .subscribe((response) => {
        this.modalService.showSweetNotification(
          'Foto atualizada',
          response?.message ?? '',
          'success'
        );
      });
  }

  onPhotoClick(): void {
    // If this component is already in a modal, do not open another modal
    if (this.isModal) {
      return;
    }

    const initialState: ModalOptions = {
      initialState: {
        isEdit: true,
        isModal: true,
        imageUrl: this.previewDataUrl,
        entityClass: this.entityClass,
        filenamePrefix: this.filenamePrefix,
      },
    };

    // Open the same component as a modal so modal-specific controls are available
    this.modalService.showTemplateModal(PhotoComponent, initialState);
  }

  close(): void {
    this.modalService.hideModal();
  }
}
