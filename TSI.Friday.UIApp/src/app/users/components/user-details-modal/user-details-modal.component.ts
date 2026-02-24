import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  FormBaseComponent,
  ModalService,
  User,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-user-details-modal',
  standalone: false,
  templateUrl: './user-details-modal.component.html',
  styleUrl: './user-details-modal.component.scss',
})
export class UserDetailsModalComponent extends FormBaseComponent {
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;
  data?: User | null = null;
  id: string | null = null;
  private _baseEndPoint: ApiType = ApiType.Users;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<UserDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
    }
  }

  save(user: User): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<User>>(`${this._baseEndPoint}/update`, user)
        .subscribe((response: WebApiResponse<User>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.modalService.showSweetNotification(
            '',
            response.message,
            'success',
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, user)
        .subscribe({
          next: (response: WebApiResponse<User>) => {
            this.saved.emit();
            this.modalService.hideModal(this.dialogRef);
            this.modalService.showSweetNotification(
              'Usuário atualizado',
              response.message,
              'success',
            );
          },
          error: (response) => {
            if (response.error.errors) {
              this.errorMessages = response.error.errors;
            } else {
              this.errorMessages.push(response.error);
            }
          },
        });
    }
  }

  close(): void {
    this.modalService.hideModal(this.dialogRef);
  }
}
