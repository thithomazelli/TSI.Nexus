import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ApiService, ApiType, ModalService } from '@friday/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment.development';
import { NavbarService } from '../../core/services/navbar/navbar.service';

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
  standalone: false,
})
export class PhotoComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  baseEndPoint: ApiType = ApiType.Photos;

  @Input()
  data: any;

  @Input()
  imageUrl?: string | null = null;

  @Input()
  placeholderIcon = true;

  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  entityClass: string = '';

  @Input()
  canDisplaySubtitle: boolean = true;

  @Output()
  imageChange = new EventEmitter<{ fileName: string }>();

  pendingFile: File | null = null;
  previewDataUrl: string | null = null;

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('videoEl')
  videoEl!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvasEl')
  canvasEl!: ElementRef<HTMLCanvasElement>;

  cameraActive = false;
  private mediaStream?: MediaStream;
  private lastObjectUrl?: string;

  constructor(
    private cd: ChangeDetectorRef,
    private modalService: ModalService,
    private apiService: ApiService,
    private navbarService: NavbarService,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.isModal = dialogData.isModal ?? false;
      this.imageUrl = dialogData.imageUrl;
      this.entityClass = dialogData.entityClass ?? '';
      this.data = dialogData.data ?? null;
    }
  }

  ngOnInit(): void {
    this.previewDataUrl = this.getPhotoUrl();
    this.navbarService.onPhotoChange().subscribe((imageUrl: string) => {
      if (imageUrl == '') {
        return;
      }

      this.previewDataUrl = imageUrl;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] && this.data && this.data.photo) {
      this.previewDataUrl = this.getPhotoUrl();
      this.imageChange.emit({ fileName: this.data.photo });
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.revokeLastObjectUrl();
  }

  getPhotoUrl(): string {
    const apiBase = environment.appUrl; // ajuste conforme seu ambiente
    if (this.data && this.data.photo && this.entityClass) {
      return `${apiBase}/uploads/${this.entityClass}/${this.data.photo}`;
    }
    return 'assets/img/no_image.png';
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/no_image.png';
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
    if (!file || !file.type.startsWith('image/')) return;
    this.revokeLastObjectUrl();
    const reader = new FileReader();
    reader.onload = () => {
      this.previewDataUrl = String(reader.result);
      this.pendingFile = file;
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
    try {
      const dataUrl = canvas.toDataURL('image/png');
      this.revokeLastObjectUrl();
      this.previewDataUrl = dataUrl;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const ext = blob.type.split('/').pop() ?? 'png';
        const fileName = `${this.data?.id}.${ext}`;
        const file = new File([blob], fileName, {
          type: blob.type,
        });
        this.pendingFile = file;
      }, 'image/png');
      this.cd.detectChanges();
      this.stopCamera();
    } catch (err) {
      console.error('capturePhoto failed', err);
      this.stopCamera();
    }
  }

  savePhoto(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (
      !this.pendingFile ||
      !this.baseEndPoint ||
      !this.data?.id ||
      !this.entityClass
    ) {
      return;
    }
    const ext = this.pendingFile.type.split('/').pop() ?? 'png';
    const fileName = `${this.data.id}.${ext}`;
    const fd = new FormData();
    fd.append('entity', this.entityClass); // 'clients', 'users', 'products'
    fd.append('entityId', String(this.data.id));
    fd.append('file', this.pendingFile, fileName);
    this.apiService
      .post<any>(`${this.baseEndPoint}/uploadPhoto`, fd)
      .subscribe((response) => {
        // fallback para fileName local caso a API não retorne
        const fileName =
          response?.fileName ||
          (this.pendingFile ? this.pendingFile.name : undefined);
        this.data.photo = fileName;
        this.imageChange.emit({ fileName });
        this.previewDataUrl = this.getPhotoUrl();
        this.imageUrl = this.previewDataUrl;
        this.pendingFile = null;
        this.close({ fileName });
        this.modalService.showSweetNotification(
          'Foto atualizada',
          'Upload realizado com sucesso!',
          'success',
        );
        this.navbarService.emitPhotoChange(this.getPhotoUrl());
      });
  }

  removePhoto(): void {
    this.previewDataUrl = null;
    this.pendingFile = null;
    this.imageChange.emit({ fileName: '' });
    this.revokeLastObjectUrl();

    // update backend mainPhoto if context provided
    if (this.baseEndPoint && this.data) {
      try {
        (this.data as any).mainPhoto = '';
      } catch {}
    }

    this.stopCamera();
  }

  private revokeLastObjectUrl(): void {
    if (this.lastObjectUrl) {
      try {
        URL.revokeObjectURL(this.lastObjectUrl);
      } catch {}
      this.lastObjectUrl = undefined;
    }
  }

  onPhotoClick(): void {
    // If this component is already in a modal, do not open another modal
    if (this.isModal) {
      return;
    }
    this.openPhotoModal();
  }

  close(result?: any): void {
    if (
      this.dialogData?.dialogRef &&
      typeof this.dialogData.dialogRef.close === 'function'
    ) {
      this.dialogData.dialogRef.close(result);
    } else {
      this.modalService.hideModal(this.dialogData?.dialogRef);
    }
  }

  private openPhotoModal(): void {
    this.modalService.showTemplateModal(PhotoComponent, {
      data: this.data,
      isEdit: true,
      isModal: true,
      imageUrl: this.data?.photo,
      entityClass: this.entityClass,
    });
  }
}
