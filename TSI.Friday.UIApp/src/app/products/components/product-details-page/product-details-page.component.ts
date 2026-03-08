import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiService,
  ApiType,
  NotificationService,
  Product,
  ProductType,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-product-details-page',
  templateUrl: './product-details-page.component.html',
  styleUrl: './product-details-page.component.scss',
  standalone: false,
})
export class ProductDetailsPageComponent {
  isEdit = false;
  data?: Product | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'image' | 'history' = 'details';

  productTypeOptions: Record<ProductType, string> = {
    [ProductType.Rental]: 'Aluguel',
    [ProductType.Sale]: 'Venda',
    [ProductType.Service]: 'Serviço',
  };

  private _baseEndPoint: ApiType = ApiType.Products;

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
      this.loadProduct(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  save(product: Product): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Product>>(`${this._baseEndPoint}/update`, product)
        .subscribe((response: WebApiResponse<Product>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
        .subscribe((response: WebApiResponse<Product>) => {
          this.routerService.navigateByUrl(
            `/${this._baseEndPoint}/${response.data.id}`,
          );
        });
    }
  }

  cancel(): void {
    this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
  }

  getProductTypeLabel(): string {
    if (!this.data?.type || this.data?.type === undefined) {
      return '';
    }
    return this.productTypeOptions[this.data.type];
  }

  private loadProduct(id: string): void {
    this.loading = true;
    this.apiService
      .get<WebApiResponse<Product>>(`${this._baseEndPoint}/getById/${id}`)
      .subscribe({
        next: (response: WebApiResponse<Product>) => {
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
