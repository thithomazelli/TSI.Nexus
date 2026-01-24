import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  OrderProduct,
  Product,
  ProductService,
  FormBaseComponent,
  CurrencyService,
} from '@friday/core';
import { Observable, startWith, map } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { ModalService } from '../../../core/services/modal/modal.service';
import { ProductDetailsModalComponent } from '../../../products/components/product-details-modal/product-details-modal.component';

@Component({
  selector: 'app-order-products-form',
  standalone: false,
  templateUrl: './order-products-form.component.html',
  styleUrl: './order-products-form.component.scss',
})
export class OrderProductsFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @ViewChild('firstInput') firstInput!: ElementRef;

  @Input()
  isEdit = false;

  @Input()
  data?: OrderProduct | null;

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  @Output()
  save = new EventEmitter<OrderProduct>();

  @Output()
  cancel = new EventEmitter<void>();

  products$!: Observable<Product[]>;
  filteredProductsSku$!: Observable<Product[]>;
  filteredProductsName$!: Observable<Product[]>;

  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private modalService: ModalService,
    private currencyService: CurrencyService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.disableEditFields();
    this.patchFormWithData();
    this.setupAutoComplete();
    this.totalPriceChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.form) {
      this.patchFormWithData();
    }
  }

  async onProductSkuBlur(): Promise<void> {
    setTimeout(() => {
      const productSku = this.form.get('productSku')!.value?.trim();
      if (!productSku) {
        this.markAsTouched('productSku');
        this.form.get('productSku')!.setErrors({ required: true });
        return;
      }
      // Verifica se o sku existe na lista de produtos
      const products = (this.products$ as any).source.value as Product[];
      const found = products.find((p) => p.sku === productSku);
      if (!found) {
        const confirmRef = this.modalService.showConfirmation({
          title: 'Produto não encontrado',
          message: `O produto "${productSku}" não existe. Deseja adicioná-lo?`,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Sim',
          confirmDelete: async () => {
            // Abrir modal de adicionar produto
            const productFormRef: MatDialogRef<any> =
              this.modalService.showTemplateModal(
                ProductDetailsModalComponent,
                {
                  data: { sku: productSku },
                  width: '600px',
                  disableClose: true,
                },
              );
            productFormRef
              .afterClosed()
              .subscribe((result: Product | undefined) => {
                if (result) {
                  // this.productService.addOrUpdateProduct(result);
                  this.form.get('productId')!.setValue(result.id);
                  this.form.get('productSku')!.setValue(result.sku);
                  this.form.get('productName')!.setValue(result.name);
                } else {
                  this.form.get('productSku')!.setValue('');
                  this.markAsTouched('productSku');
                  this.form.get('productSku')!.setErrors({ required: true });
                }
              });
          },
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) {
            this.form.get('productSku')!.setValue('');
            this.markAsTouched('productSku');
            this.form.get('productSku')!.setErrors({ required: true });
          }
        });
      }
    }, 200);
  }

  async onProductNameBlur(): Promise<void> {
    setTimeout(() => {
      const productName = this.form.get('productName')!.value?.trim();
      if (!productName) {
        this.markAsTouched('productName');
        this.form.get('productName')!.setErrors({ required: true });
        return;
      }
      // Verifica se o nome existe na lista de clientes
      const products = (this.products$ as any).source.value as Product[];
      const found = products.find((p) => p.name === productName);
      if (!found) {
        const confirmRef = this.modalService.showConfirmation({
          title: 'Produto não encontrado',
          message: `O produto "${productName}" não existe. Deseja adicioná-lo?`,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Sim',
          confirmDelete: async () => {
            // Abrir modal de adicionar produto
            const productFormRef: MatDialogRef<any> =
              this.modalService.showTemplateModal(
                ProductDetailsModalComponent,
                {
                  data: { name: productName },
                  width: '600px',
                  disableClose: true,
                },
              );
            productFormRef
              .afterClosed()
              .subscribe((result: Product | undefined) => {
                if (result) {
                  // this.productService.addOrUpdateProduct(result);
                  this.form.get('productId')!.setValue(result.id);
                  this.form.get('productSku')!.setValue(result.sku);
                  this.form.get('productName')!.setValue(result.name);
                } else {
                  this.form.get('productName')!.setValue('');
                  this.markAsTouched('productName');
                  this.form.get('productName')!.setErrors({ required: true });
                }
              });
          },
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) {
            this.form.get('productName')!.setValue('');
            this.markAsTouched('productName');
            this.form.get('productName')!.setErrors({ required: true });
          }
        });
      }
    }, 200);
  }

  onQuantityBlur(): void {
    const quantityControl = this.form.get('quantity');
    const productSku = this.form.get('productSku')?.value;
    if (!quantityControl || !productSku) {
      return;
    }

    const products = (this.products$ as any).source.value as Product[];
    const product = products.find((p) => p.sku === productSku);
    if (product?.quantityInStock == null) {
      return;
    }

    const quantity =
      Number(quantityControl.value) - (this.data?.previousQuantity ?? 0);
    if (quantity > product.quantityInStock) {
      this.modalService.showNotification(
        false,
        'Quantidade maior que estoque',
        `A quantidade acrescentada (${quantity}) é maior do que o estoque disponível (${product.quantityInStock}).`,
      );
      quantityControl.setValue(this.data?.previousQuantity);
    }
  }

  selectProduct(product: Product) {
    if (!product) {
      return;
    }

    // Validação de estoque
    if (
      product.quantityInStock === undefined ||
      product.quantityInStock === null ||
      product.quantityInStock <= 0
    ) {
      this.modalService.showNotification(
        false,
        'Produto sem estoque',
        `O produto "${product.name}" está sem estoque!`,
      );
      // Limpa seleção para forçar nova escolha
      this.form.get('productSku')?.setValue('');
      this.form.get('productName')?.setValue('');
      return;
    }

    if (!this.form.get('productId')) {
      this.form.addControl('productId', this.formBuilder.control(''));
    }

    this.form.patchValue({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      price: product.price,
      priceFormatted: this.currencyService.formatCurrencyBRL(product.price),
    });
    this.updateTotalPrice();
  }

  submit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      previousQuantity: [0],
      price: [0, [Validators.required]],
      priceFormatted: [{ value: 0 }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      totalPriceFormatted: [{ value: 0, disabled: true }],
      productId: [''],
      productName: [''],
      productSku: [''],
    });

    if (this.isEdit) {
      this.form.addControl('id', this.formBuilder.control(''));
    } else {
      // Atualiza productId ao selecionar produto
      this.form.get('productName')!.valueChanges.subscribe((name) => {
        const product = (this.products$ as any).source.value.find(
          (p: Product) => p.name === name,
        );
        if (product) {
          this.form.get('productId')!.setValue(product.id);
        }
      });
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const patch = {
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
        totalPriceFormatted: this.currencyService.formatCurrencyBRL(
          this.data.totalPrice,
        ),
      };
      this.form.patchValue(patch);
    } else {
      this.form
        .get('priceFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(this.data?.price));
    }
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('productSku')?.disable();
      this.form.get('productName')?.disable();
    }
  }

  private setupAutoComplete(): void {
    this.products$ = this.productService.getProducts();
    this.filteredProductsSku$ = this.form.get('productSku')!.valueChanges.pipe(
      startWith(''),
      map((value: string | Product) => {
        let filterValue = '';
        if (typeof value === 'string') {
          filterValue = value.toLowerCase();
        } else if (value && typeof value === 'object') {
          filterValue = value.sku?.toLowerCase() || '';
        }
        if (!filterValue) {
          return [];
        }
        return (this.products$ as any).source.value.filter((product: Product) =>
          (product.sku || '').toLowerCase().includes(filterValue),
        );
      }),
    );
    this.filteredProductsName$ = this.form
      .get('productName')!
      .valueChanges.pipe(
        startWith(''),
        map((value: string | Product) => {
          let filterValue = '';
          if (typeof value === 'string') {
            filterValue = value.toLowerCase();
          } else if (value && typeof value === 'object') {
            filterValue = value.name?.toLowerCase() || '';
          }
          if (!filterValue) {
            return [];
          }
          return (this.products$ as any).source.value.filter(
            (product: Product) =>
              (product.name || '').toLowerCase().includes(filterValue),
          );
        }),
      );
  }

  private totalPriceChange(): void {
    // Atualiza totalPrice ao inicializar no modo edição
    setTimeout(() => this.updateTotalPrice(), 0);

    // Atualiza totalPrice ao alterar produto, quantidade, preço ou desconto
    this.form
      .get('productSku')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());

    this.form
      .get('productName')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());

    this.form
      .get('quantity')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());

    this.form
      .get('discount')
      ?.valueChanges.subscribe(() => this.updateTotalPrice());
  }

  onPriceBlur(): void {
    const priceControl = this.form.get('priceFormatted');
    if (!priceControl) {
      return;
    }

    const value = this.currencyService.parseCurrencyBRL(priceControl.value);
    priceControl.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get('price')?.setValue(value);
    this.updateTotalPrice();
  }

  private updateTotalPrice(): void {
    let priceValue = this.form.get('price')?.value || 0;

    if (typeof priceValue === 'string') {
      priceValue = priceValue
        .replace(/R\$\s?/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
    }
    const price = Number(priceValue) || 0;
    const quantity = Number(this.form.get('quantity')?.value) || 0;
    const discount = Number(this.form.get('discount')?.value) || 0;
    const total = price * quantity * (1 - discount / 100);

    this.form.get('totalPrice')?.setValue(total);

    this.form
      .get('totalPriceFormatted')
      ?.setValue(this.currencyService.formatCurrencyBRL(total));
  }
}
