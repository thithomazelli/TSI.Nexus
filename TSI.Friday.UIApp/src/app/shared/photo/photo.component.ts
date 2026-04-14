import { Observable, Subscription } from 'rxjs';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  Attachment,
  AttachmentService,
  ModalService,
  PhotoService,
} from '@friday/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
  standalone: false,
})
export class PhotoComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  data: any;

  @Input()
  imageUrl?: string | null = null;

  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  entityClass: string = '';

  @Input()
  canDisplaySubtitle: boolean = true;

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('videoEl')
  videoEl!: ElementRef<HTMLVideoElement>;

  @ViewChild('canvasEl')
  canvasEl!: ElementRef<HTMLCanvasElement>;

  cameraActive = false;
  pendingFile: File | null = null;
  pendingRemoval = false;

  private mediaStream?: MediaStream;
  private lastObjectUrl?: string;

  private navbarPhotoSub?: Subscription;

  constructor(
    private cd: ChangeDetectorRef,
    private modalService: ModalService,
    private attachmentService: AttachmentService,
    private photoService: PhotoService,
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
    this.loadPhoto();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] && this.data && this.data.photo) {
      this.loadPhoto();
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.revokeLastObjectUrl();
    this.navbarPhotoSub?.unsubscribe();
    this.imageUrl = this.getNoImage();
  }

  loadPhoto(): void {
    if (this.data && this.data.photo && this.entityClass && this.data.id) {
      this.imageUrl = this.getNoImage();
      this.photoService
        .getPhoto(this.entityClass, this.data.id, this.data.photo)
        .subscribe({
          next: (blob) => {
            this.revokeLastObjectUrl();
            const url = URL.createObjectURL(blob);
            this.lastObjectUrl = url;
            this.imageUrl = url;
            this.cd.detectChanges();
          },
          error: () => {
            this.imageUrl = this.getNoImage();
          },
        });
      return;
    }
    this.imageUrl = this.getNoImage();
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getNoImage();
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
        video: { facingMode: 'user' },
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
      this.imageUrl = String(reader.result);
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
      this.imageUrl = dataUrl;
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

    if (!this.data?.id || !this.entityClass) {
      return;
    }

    // Remoção da foto
    if (this.pendingRemoval) {
      // Remove o anexo correspondente
      this.deletePhotoAttachment();

      // Limpa o campo photo na entidade
      this.photoService.removePhoto(this.entityClass, this.data.id).subscribe({
        next: () => {
          this.data.photo = '';
          this.pendingRemoval = false;
          this.imageUrl = this.getNoImage();

          this.modalService.showSweetNotification(
            'Foto removida',
            'Foto removida com sucesso!',
            'success',
          );

          if (this.entityClass === 'Users') {
            this.photoService.updateUserPhoto('', this.data.id);
          }

          this.close({ photoPath: '' });
        },
        error: () => {
          this.modalService.showSweetNotification(
            '',
            'Erro ao remover foto.',
            'error',
          );
        },
      });
      return;
    }

    if (!this.pendingFile) return;

    const file = this.pendingFile;

    // 1) Anexa o arquivo primeiro
    this.addPhotoAsAttachment(file, () => {
      // 2) Depois atualiza o atributo photo na entidade
      this.photoService
        .uploadPhoto(this.entityClass, this.data.id, file)
        .subscribe({
          next: (uploadRes) => {
            const photoPath = uploadRes?.fileName ?? uploadRes?.path ?? '';
            this.data.photo = photoPath;
            this.loadPhoto();
            this.pendingFile = null;

            this.modalService.showSweetNotification(
              'Foto atualizada',
              'Upload realizado com sucesso!',
              'success',
            );

            if (this.entityClass === 'Users') {
              this.photoService.updateUserPhoto(photoPath, this.data.id);
            }

            this.close({ photoPath });
          },
          error: () => {
            this.modalService.showSweetNotification(
              '',
              'Erro ao salvar foto.',
              'error',
            );
          },
        });
    });
  }

  private addPhotoAsAttachment(file: File, onSuccess?: () => void): void {
    const entityIdField = this.getEntityIdField();
    const attachment: Partial<Attachment> = {
      file,
      [entityIdField]: this.data.id,
    };
    const overridePath = `photos/${this.entityClass}`;
    this.attachmentService
      .add(attachment as Attachment, overridePath)
      .subscribe({
        next: () => onSuccess?.(),
        error: () => onSuccess?.(),
      });
  }

  private deletePhotoAttachment(): void {
    if (!this.data?.photo || !this.data?.id) return;

    const photoFileName = this.data.photo;
    const entityIdField = this.getEntityIdField();
    const entityMap: Record<string, (id: string) => Observable<any>> = {
      userId: (id) => this.attachmentService.getByUserId(id),
      businessPartnerId: (id) =>
        this.attachmentService.getByBusinessPartnerId(id),
      productId: (id) => this.attachmentService.getByProductId(id),
      orderId: (id) => this.attachmentService.getByOrderId(id),
      transactionId: (id) => this.attachmentService.getByTransactionId(id),
      paymentId: (id) => this.attachmentService.getByPaymentId(id),
    };

    const fetchFn = entityMap[entityIdField];
    if (!fetchFn) return;

    fetchFn(this.data.id).subscribe({
      next: (res: any) => {
        const attachments: Attachment[] = res?.data ?? [];
        const match = attachments.find((a) => a.fileName === photoFileName);
        if (match) {
          this.attachmentService.delete(match.id).subscribe();
        }
      },
    });
  }

  private getEntityIdField(): string {
    const map: Record<string, string> = {
      Users: 'userId',
      BusinessPartners: 'businessPartnerId',
      Products: 'productId',
      Orders: 'orderId',
      Transactions: 'transactionId',
      Payments: 'paymentId',
    };
    return map[this.entityClass] ?? 'userId';
  }

  removePhoto(): void {
    this.imageUrl = this.getNoImage();
    this.pendingFile = null;
    this.pendingRemoval = true;
    this.revokeLastObjectUrl();
    this.stopCamera();
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

  private revokeLastObjectUrl(): void {
    if (this.lastObjectUrl) {
      try {
        URL.revokeObjectURL(this.lastObjectUrl);
      } catch {}
      this.lastObjectUrl = undefined;
    }
  }

  private getNoImage(): string {
    return this.entityClass == 'User'
      ? 'assets/img/no_profile.png'
      : 'assets/img/no_image.png';
  }
}
