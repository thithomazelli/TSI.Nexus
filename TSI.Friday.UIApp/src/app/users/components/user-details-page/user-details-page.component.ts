import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiService,
  ApiType,
  NotificationService,
  User,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-user-details-page',
  standalone: false,
  templateUrl: './user-details-page.component.html',
  styleUrl: './user-details-page.component.scss',
})
export class UserDetailsPageComponent {
  isEdit = false;
  data?: User | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'form' | 'image' | 'extra' = 'form';

  private _baseEndPoint: ApiType = ApiType.Users;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private routerService: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.loadUser(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  save(User: User): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<User>>(`${this._baseEndPoint}/update`, User)
        .subscribe((response: WebApiResponse<User>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, User)
        .subscribe((response: WebApiResponse<User>) => {
          this.routerService.navigateByUrl(
            `/${this._baseEndPoint}/${response.data.id}`,
          );
        });
    }
  }

  cancel(): void {
    this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
  }

  onImageChange(fileOrNull: File | null): void {
    // fileOrNull is selected/captured image. you can upload it to server here.
    if (!fileOrNull) {
      // remove on server if needed
      return;
    }

    const fd = new FormData();
    fd.append('file', fileOrNull);
    if (this.id) fd.append('UserId', String(this.id));
    // example upload endpoint - adapt as needed
    this.apiService.post(`${this._baseEndPoint}/uploadImage`, fd).subscribe();
  }

  private loadUser(id: string): void {
    this.loading = true;
    this.apiService
      .get<WebApiResponse<User>>(`${this._baseEndPoint}/getById/${id}`)
      .subscribe({
        next: (response: WebApiResponse<User>) => {
          this.loading = false;

          if (response.data == null) {
            this.routerService.navigateByUrl('/not-found');
            return;
          }

          this.data = response.data;
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }
}
