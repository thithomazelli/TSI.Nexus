import { Component } from '@angular/core';
import {
  ApiService,
  ApiType,
  ModalService,
  User,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { UserDetailsModalComponent } from './components/user-details-modal/user-details-modal.component';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  baseEndPoint = ApiType.Users;

  rowData: User[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      // minWidth: 80,
      hide: true,
      sortingOrder: ['asc', 'desc'],
    },
    {
      field: 'photo',
      headerName: 'Foto',
      sortable: true,
      filter: false,
      width: 70,
      resizable: true,
      cellRenderer: (params: ValueFormatterParams) => {
        const apiBase = environment.appUrl;
        const imageUrl = params.value
          ? `${apiBase}/uploads/user/${params.value}`
          : 'assets/img/no_profile.png';
        const userId = params.data?.id;
        return `<div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
          <a 
            class="ag-link"
            data-action="view"
            routerLink="/${this.baseEndPoint}/${params.data.id}">
            <img src="${imageUrl}" alt="User Photo" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
          </a>
        </div>`;
      },
    },
    {
      headerName: 'Nome Completo',
      colId: 'fullName',
      sortable: true,
      filter: true,
      width: 200,
      flex: 2,
      valueGetter: (params) => {
        const user = params.data ?? {};
        return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      },
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a
          class="ag-link"
          data-action="view"
          routerLink="/${this.baseEndPoint}/${params.data.id}">${value}</a>`;
      },
    },
    {
      field: 'userName',
      headerName: 'Nome de Usuário',
      sortable: true,
      filter: true,
      width: 300,
      resizable: false,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="view" routerLink="/${this.baseEndPoint}/${params.data.id}" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filter: true,
      width: 300,
      resizable: true,
    },
    {
      field: 'emailConfirmed',
      headerName: 'Email Confirmado',
      sortable: true,
      filter: true,
      maxWidth: 200,
    },
    {
      field: 'role',
      headerName: 'Perfil',
      sortable: true,
      filter: true,
      resizable: true,
    },
    {
      headerName: 'Ações',
      sortable: false,
      filter: false,
      maxWidth: 400,
      resizable: true,
      width: 280,
      cellRenderer: (params: ICellRendererParams) => {
        return `
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-folder" data-action="view"></i>
          </button>
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit" data-action="edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash" data-action="delete"></i>
          </button>
        `;
      },
    },
  ];

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.getUsers();
  }

  refreshUsers(): void {
    this.getUsers();
  }

  deleteUser(user: User): void {
    this.apiService
      .delete<WebApiResponse<User>>(`${this.baseEndPoint}/remove`, user)
      .subscribe((response: WebApiResponse<User>) => {
        this.rowData = this.rowData.filter((p) => p.id !== user.id);
        this.modalService.hideModal();

        this.modalService.showSweetNotification(
          'Usuário excluído',
          response.message,
          'success',
        );
      });
  }

  onOpenModal(initialState: any) {
    const ref = this.modalService.showTemplateModal(
      UserDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.getUsers();
        ref.close();
      });
    }
  }

  private getUsers(): void {
    this.apiService
      .get<WebApiResponse<User[]>>(`${this.baseEndPoint}/getAll`)
      .subscribe((response: WebApiResponse<User[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
