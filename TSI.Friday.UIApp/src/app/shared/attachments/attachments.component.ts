import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import {
  Attachment,
  BreadcrumbItem,
  FolderNode,
  ResponseStatus,
} from '@friday/core';
import { AttachmentService } from '../../core/services/attachment/attachment.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { NotificationService } from '../../core/services/notification/notification.service';

@Component({
  selector: 'app-attachments',
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss',
  standalone: false,
})
export class AttachmentsComponent implements OnInit {
  @Input()
  entity = 'businessPartner';

  @Input()
  entityId = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  attachments: Attachment[] = [];
  rootFolder: FolderNode = {
    name: 'Anexos',
    path: '',
    children: [],
    files: [],
  };
  currentFolder: FolderNode = this.rootFolder;
  breadcrumbs: BreadcrumbItem[] = [];
  loading = false;

  selectedFile: Attachment | null = null;
  contextMenuItems: MenuItem[] = [];
  showDetailsDialog = false;
  viewMode: 'list' | 'grid' = 'list';

  // --- Add attachment dialog ---
  showAddDialog = false;
  addFile: File | null = null;
  addPath = '';

  // --- Add folder dialog ---
  showFolderDialog = false;
  newFolderName = '';

  // --- Drag & Drop ---
  isDraggingOver = false;
  dragOverFolder: FolderNode | null = null;

  private _pathPrefix = '';

  constructor(
    private attachmentService: AttachmentService,
    private modalService: ModalService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadAttachments();
  }

  refresh(): void {
    this.loadAttachments();
  }

  // ─── Navigation ─────────────────────────────────────────

  navigateToPath(path: string): void {
    this.currentFolder = this.findFolder(path);
    this.selectedFile = null;
    this.buildBreadcrumbs();
    this.buildContextMenu();
  }

  navigateUp(): void {
    const parts = this.currentFolder.path.split('/').filter(Boolean);
    parts.pop();
    this.navigateToPath(parts.join('/'));
  }

  isAtRoot(): boolean {
    return this.currentFolder === this.rootFolder;
  }

  // ─── Selection & Context Menu ───────────────────────────

  selectFile(file: Attachment): void {
    this.selectedFile = file;
    this.buildContextMenu();
  }

  onFileContextMenu(event: MouseEvent, file: Attachment): void {
    this.selectedFile = file;
    this.buildContextMenu();
  }

  buildContextMenu(): void {
    this.contextMenuItems = [
      {
        label: 'Detalhes',
        icon: 'pi pi-info-circle',
        command: () => this.openDetailsDialog(),
        visible: !!this.selectedFile,
      },
      {
        label: 'Baixar',
        icon: 'pi pi-download',
        command: () => {
          if (this.selectedFile) this.downloadFile(this.selectedFile);
        },
        visible: !!this.selectedFile,
      },
      {
        label: 'Remover',
        icon: 'pi pi-trash',
        styleClass: 'text-danger',
        command: () => this.removeFile(),
        visible: !!this.selectedFile,
      },
    ];
  }

  openDetailsDialog(): void {
    if (!this.selectedFile) return;
    this.showDetailsDialog = true;
  }

  /** Reconstrói o path completo a partir do path relativo da árvore, sem o segmento 'attachments/' (o backend adiciona automaticamente). */
  getFullPath(relativePath: string): string {
    if (!this._pathPrefix) return relativePath;
    // Remove o primeiro segmento 'attachments/' do prefix, pois o backend já o adiciona
    const prefixWithoutRoot = this._pathPrefix.replace(/^attachments\/?/, '');
    if (!prefixWithoutRoot) return relativePath;
    return relativePath
      ? `${prefixWithoutRoot}/${relativePath}`
      : prefixWithoutRoot;
  }

  openAddDialog(): void {
    this.addFile = null;
    this.addPath = this.getFullPath(this.currentFolder.path);
    this.showAddDialog = true;
    setTimeout(() => {
      if (this.fileInput) this.fileInput.nativeElement.value = '';
    });
  }

  onAddFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFile = input.files[0];
    }
  }

  addAttachment(): void {
    if (!this.addFile) return;

    const attachment: Partial<Attachment> = {
      file: this.addFile,
      [this.entityIdField]: this.entityId,
    };

    this.attachmentService
      .add(attachment as Attachment, this.addPath || undefined)
      .subscribe({
        next: (res) => {
          this.showAddDialog = false;
          this.modalService.showSweetNotification('', res.message, res.status);
          if (res.status === ResponseStatus.Success) {
            this.loadAttachments();
          }
        },
        error: () => {
          this.notificationService.showMessage(
            'Error',
            'Erro ao adicionar anexo.',
          );
        },
      });
  }

  openFolderDialog(): void {
    this.newFolderName = '';
    this.showFolderDialog = true;
  }

  addFolder(): void {
    if (!this.newFolderName.trim()) return;
    const folderPath = this.currentFolder.path
      ? `${this.currentFolder.path}/${this.newFolderName.trim()}`
      : this.newFolderName.trim();

    let folder = this.findFolder(folderPath);
    if (folder === this.rootFolder && folderPath) {
      // Folder doesn't exist yet — create it in the tree
      const newFolder: FolderNode = {
        name: this.newFolderName.trim(),
        path: folderPath,
        children: [],
        files: [],
      };
      this.currentFolder.children.push(newFolder);
    }
    this.showFolderDialog = false;
  }

  removeFile(): void {
    if (!this.selectedFile) return;

    this.modalService
      .showSweetConfirmation(
        '',
        'Deseja realmente excluir este anexo?',
        'question',
      )
      .then((result) => {
        if (result.isConfirmed && this.selectedFile) {
          this.attachmentService.delete(this.selectedFile.id).subscribe({
            next: (res) => {
              this.modalService.showSweetNotification(
                '',
                res.message,
                res.status,
              );
              if (res.status === ResponseStatus.Success) {
                this.selectedFile = null;
                this.loadAttachments();
              }
            },
            error: () => {
              this.notificationService.showMessage(
                'Error',
                'Erro ao remover anexo.',
              );
            },
          });
        }
      });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Only reset if leaving the container (not entering a child)
    const relatedTarget = event.relatedTarget as HTMLElement;
    const container = event.currentTarget as HTMLElement;
    if (!container.contains(relatedTarget)) {
      this.isDraggingOver = false;
      this.dragOverFolder = null;
    }
  }

  onFolderDragOver(event: DragEvent, folder: FolderNode): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverFolder = folder;
  }

  onFolderDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverFolder = null;
  }

  onDropOnFolder(event: DragEvent, folder: FolderNode): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
    this.dragOverFolder = null;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const targetPath = this.getFullPath(folder.path);
      this.uploadDroppedFile(files[0], targetPath);
    }
  }

  onDropOnContainer(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
    this.dragOverFolder = null;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const targetPath = this.getFullPath(this.currentFolder.path);
      this.uploadDroppedFile(files[0], targetPath);
    }
  }

  downloadFile(file: Attachment): void {
    this.attachmentService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName || 'download';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.notificationService.showMessage(
          'Error',
          'Erro ao baixar arquivo.',
        );
      },
    });
  }

  getFileIcon(fileName?: string): string {
    if (!fileName) return 'pi pi-file';
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext))
      return 'pi pi-image';
    if (ext === 'pdf') return 'pi pi-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'pi pi-file-word';
    if (['xls', 'xlsx'].includes(ext)) return 'pi pi-file-excel';
    return 'pi pi-file';
  }

  private get entityIdField(): string {
    const map: Record<string, string> = {
      businessPartner: 'businessPartnerId',
      order: 'orderId',
      transaction: 'transactionId',
      payment: 'paymentId',
      product: 'productId',
      user: 'userId',
    };
    return map[this.entity] ?? 'businessPartnerId';
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbs = [{ label: 'Anexos', path: '' }];
    const parts = this.currentFolder.path.split('/').filter(Boolean);
    let accumulated = '';
    for (const part of parts) {
      accumulated = accumulated ? `${accumulated}/${part}` : part;
      this.breadcrumbs.push({ label: part, path: accumulated });
    }
  }

  private uploadDroppedFile(file: File, overridePath: string): void {
    const attachment: Partial<Attachment> = {
      file,
      [this.entityIdField]: this.entityId,
    };

    this.attachmentService
      .add(attachment as Attachment, overridePath || undefined)
      .subscribe({
        next: (res) => {
          this.modalService.showSweetNotification('', res.message, res.status);
          if (res.status === ResponseStatus.Success) {
            this.loadAttachments();
          }
        },
        error: () => {
          this.notificationService.showMessage(
            'Error',
            'Erro ao adicionar anexo.',
          );
        },
      });
  }

  private loadAttachments(): void {
    if (!this.entityId) {
      return;
    }
    this.loading = true;

    const entityMap: Record<
      string,
      (id: string) => ReturnType<AttachmentService['getByBusinessPartnerId']>
    > = {
      businessPartner: (id) =>
        this.attachmentService.getByBusinessPartnerId(id),
      order: (id) => this.attachmentService.getByOrderId(id),
      transaction: (id) => this.attachmentService.getByTransactionId(id),
      payment: (id) => this.attachmentService.getByPaymentId(id),
      product: (id) => this.attachmentService.getByProductId(id),
      user: (id) => this.attachmentService.getByUserId(id),
    };

    const fetchFn = entityMap[this.entity];
    if (!fetchFn) {
      this.loading = false;
      return;
    }

    const currentPath = this.currentFolder.path;

    fetchFn(this.entityId).subscribe({
      next: (res) => {
        this.attachments = res.data ?? [];
        this.buildTree();
        this.navigateToPath(currentPath);
        this.loading = false;
      },
      error: () => {
        this.attachments = [];
        this.buildTree();
        this.navigateToPath(currentPath);
        this.loading = false;
      },
    });
  }

  // ─── Tree Building ──────────────────────────────────────

  /**
   * Mapeia a entidade para o nome da pasta correspondente no backend.
   * Ex: businessPartner → 'BusinessPartners', order → 'Orders'
   */
  private get entityFolderKey(): string {
    const map: Record<string, string> = {
      businessPartner: 'BusinessPartners',
      order: 'Orders',
      transaction: 'Transactions',
      payment: 'Payments',
      product: 'Products',
      user: 'Users',
    };
    return map[this.entity] ?? '';
  }

  /**
   * Detecta o prefixo estrutural do path usando a pasta da entidade como âncora.
   * Ex: entity='order' → encontra 'Orders' no path e tira tudo até 'Orders/{OrderNumber}'.
   * Resultado: a raiz da árvore começa no contexto da entidade acessada.
   */
  private detect_pathPrefix(): { prefix: string; rootName: string } {
    const folderKey = this.entityFolderKey;
    if (!folderKey) return { prefix: '', rootName: 'Anexos' };

    for (const att of this.attachments) {
      if (att.path) {
        const parts = att.path.split('/').filter(Boolean);
        const keyIndex = parts.indexOf(folderKey);
        if (keyIndex >= 0 && keyIndex + 1 < parts.length) {
          const depth = keyIndex + 2;
          return {
            prefix: parts.slice(0, depth).join('/'),
            rootName: parts[keyIndex + 1],
          };
        }
      }
    }
    return { prefix: '', rootName: 'Anexos' };
  }

  private buildTree(): void {
    const { prefix, rootName } = this.detect_pathPrefix();
    this._pathPrefix = prefix;
    this.rootFolder = { name: rootName, path: '', children: [], files: [] };

    for (const att of this.attachments) {
      const rawPath = att.path ?? '';
      const stripped =
        prefix && rawPath.startsWith(prefix)
          ? rawPath.slice(prefix.length).replace(/^\//, '')
          : rawPath;

      const parts = stripped.split('/').filter(Boolean);
      let current = this.rootFolder;

      for (const part of parts) {
        const childPath = current.path ? `${current.path}/${part}` : part;
        let child = current.children.find((c) => c.name === part);
        if (!child) {
          child = { name: part, path: childPath, children: [], files: [] };
          current.children.push(child);
        }
        current = child;
      }

      current.files.push(att);
    }
  }

  private findFolder(path: string): FolderNode {
    if (!path) return this.rootFolder;
    const parts = path.split('/').filter(Boolean);
    let current = this.rootFolder;
    for (const part of parts) {
      const child = current.children.find((c) => c.name === part);
      if (!child) return this.rootFolder;
      current = child;
    }
    return current;
  }
}
