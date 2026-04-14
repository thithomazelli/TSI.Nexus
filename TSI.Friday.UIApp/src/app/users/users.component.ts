import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ApiType,
  ModalService,
  NotificationService,
  PhotoService,
  ResponseStatus,
  User,
  UserService,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { UserDetailsModalComponent } from './components/user-details-modal/user-details-modal.component';
import { Subject, Subscription, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  standalone: false,
})
export class UsersComponent implements OnInit, OnDestroy {
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
      cellRenderer: (params: ICellRendererParams) => {
        const attachmentId = params.value;
        const userId = params.data?.id;
        const container = document.createElement('div');
        container.style.cssText =
          'display:flex;justify-content:center;align-items:center;width:100%;height:100%';

        const link = document.createElement('a');
        link.className = 'ag-link';
        link.setAttribute('data-action', 'view');
        container.appendChild(link);

        const fallback = document.createElement('span');
        fallback.style.cssText =
          'width:35px;height:35px;line-height:35px;text-align:center;font-size:22px;color:#adb5bd;background:#f1f3f4;border-radius:50%;display:inline-block';
        fallback.innerHTML = "<i class='fas fa-user'></i>";
        link.appendChild(fallback);

        if (attachmentId) {
          const img = document.createElement('img');
          img.alt = 'User Photo';
          img.style.cssText =
            'width:35px;height:35px;border-radius:50%;object-fit:cover;display:none';
          link.insertBefore(img, fallback);

          this.photoService.getPhoto('Users', userId, attachmentId).subscribe({
            next: (blob) => {
              img.src = URL.createObjectURL(blob);
              img.style.display = '';
              fallback.style.display = 'none';
            },
            error: () => {
              /* keep fallback visible */
            },
          });
        }

        return container;
      },
    },
    {
      headerName: 'Nome Completo',
      colId: 'fullName',
      sortable: true,
      filter: true,
      width: 200,
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
      filterValueGetter: (params: ValueGetterParams) => {
        return this.getRoleLabel(params.data?.role);
      },
      cellRenderer: (params: ICellRendererParams) => {
        return this.getRoleLabel(params.data?.role);
      },
    },
    {
      headerName: 'Ações',
      flex: 1,
      minWidth: 150,
      sortable: false,
      filter: false,
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

  roleMap: { [key: string]: string } = {
    Admin: 'Administrador',
    User: 'Usuário',
  };

  private _userChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private userService: UserService,
    private photoService: PhotoService,
  ) {}

  ngOnInit(): void {
    this._userChangedSub = this.userService.userChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.getUsers();
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._userChangedSub) {
      this._userChangedSub.unsubscribe();
    }
  }

  openModal(initialState: any) {
    this.modalService.showTemplateModal(
      UserDetailsModalComponent,
      initialState,
    );
  }

  deleteUser(user: User): void {
    this.userService
      .delete(user)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<User>) => {
        if (response.status === ResponseStatus.Success) {
          this.rowData = this.rowData.filter((p) => p.id !== user.id);
        }
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          response.status,
        );
      });
  }

  refreshUsers(): void {
    this.userService
      .refresh()
      .pipe(
        tap({
          next: () =>
            this.notificationService.showMessage(
              ResponseStatus.Success,
              'Usuários atualizados com sucesso',
            ),
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao atualizar usuários',
            ),
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<User[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/no_profile.png';
  }

  private getUsers(): void {
    this.userService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<User[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private getRoleLabel(role: string): string {
    return this.roleMap[role] ?? role ?? '';
  }
}
