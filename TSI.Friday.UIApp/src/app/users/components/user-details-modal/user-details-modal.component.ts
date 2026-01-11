import { Component, Input } from '@angular/core';
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
  @Input()
  isEdit = false;

  @Input()
  data?: User | null = null;

  @Input()
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Users;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private gridService: GridService
  ) {
    super();
  }

  save(user: User): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<User>>(`${this._baseEndPoint}/update`, user)
        .subscribe((response: WebApiResponse<User>) => {
          this.gridService.gridDataChanged(response.data, this.id);
          this.modalService.hideModal();
          this.modalService.showSweetNotification(
            'Usuário cadastrado',
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
