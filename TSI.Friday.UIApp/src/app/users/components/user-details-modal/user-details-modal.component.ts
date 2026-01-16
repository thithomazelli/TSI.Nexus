import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  FormBaseComponent,
  GridService,
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
  isEdit = false;
  data?: User | null = null;
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Users;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private gridService: GridService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
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
          this.gridService.gridDataChanged(response.data, this.id);
          this.modalService.hideModal();
          this.modalService.showSweetNotification(
            '',
            response.message,
            'success'
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, user)
        .subscribe({
          next: (response: WebApiResponse<User>) => {
            this.gridService.gridDataChanged(response.data, null);
            this.modalService.hideModal();
            this.modalService.showSweetNotification(
              'Usuário atualizado',
              response.message,
              'success'
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
    this.modalService.hideModal();
  }
}
