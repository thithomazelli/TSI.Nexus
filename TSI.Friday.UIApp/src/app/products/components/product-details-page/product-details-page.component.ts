import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiType,
  Product,
  ProductService,
  ProductType,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

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

  private _destroy$ = new Subject<void>();
  private _baseEndPoint: ApiType = ApiType.Products;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');

    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getProductById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  getProductTypeLabel(): string {
    if (!this.data?.type || this.data?.type === undefined) {
      return '';
    }
    return this.productTypeOptions[this.data.type];
  }

  private getProductById(id: string): void {
    this.loading = true;
    this.productService
      .getById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
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
