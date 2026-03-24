import { firstValueFrom } from 'rxjs';
import {
  Component,
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
  OrderProductStatus,
  ModalService,
  ProductType,
  Address,
  ApiService,
  WebApiResponse,
  ApiType,
  Order,
  ResponseStatus,
} from '@friday/core';
import { Observable, startWith, map } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

import { ProductDetailsModalComponent } from '../../../products/components/product-details-modal/product-details-modal.component';
import { AddressDetailsModalComponent } from '../../../address/components/address-details-modal/address-details-modal.component';

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
  @ViewChild('endDateField')
  endDateField: any;

  @Input()
  parentId: string | null = null;

  @Input()
  parentData: any;

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

  showAllAddresses = false;
  customerAddresses: Address[] = [];

  products$!: Observable<Product[]>;
  filteredProductsSku$!: Observable<Product[]>;
  filteredProductsName$!: Observable<Product[]>;

  productTypeOptions = [
    { label: 'Aluguel', value: ProductType.Rental },
    { label: 'Venda', value: ProductType.Sale },
    { label: 'Serviço', value: ProductType.Service },
  ];

  orderProductStatusOptions = [
    { label: 'Vigente', value: OrderProductStatus.InProgress },
    { label: 'Atrasado', value: OrderProductStatus.Delayed },
    { label: 'Devolvido', value: OrderProductStatus.Returned },
  ];

  orderProductInfo = [
    {
      InProgress: 'Vigente',
      data: { icon: 'info', message: 'Pedido em andamento.' },
    },
    {
      Delayed: 'Atrasado',
      data: { icon: 'exclamation', message: 'Pedido em atrasado.' },
    },
    {
      Returned: 'Devolvido',
      data: { icon: 'check', message: 'Produto devolvido.' },
    },
  ];

  private _orderData: Order | null = null;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private modalService: ModalService,
    private currencyService: CurrencyService,
  ) {
    super();
  }

  async ngOnInit(): Promise<void> {
    this.initForm();
    this.disableEditFields();
    this.patchFormWithData();
    this.setupAutoComplete();
    this.totalPriceChange();
    await this.initParentInfo();
    await this.initAddressInfo();

    // Enable/disable quantity field based on productType
    const quantityControl = this.form.get('quantity');
    const productTypeControl = this.form.get('productType');
    if (productTypeControl && quantityControl) {
      const setQuantityState = (type: string) => {
        if (type === 'Sale') {
          quantityControl.enable();
        } else {
          quantityControl.disable();
        }
      };
      setQuantityState(productTypeControl.value);
      productTypeControl.valueChanges.subscribe((type: string) => {
        setQuantityState(type);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.form) {
      this.patchFormWithData();
    }
  }

  get defaultAddress(): Address | null {
    return (
      this.customerAddresses?.find((a) => a.isDefault) ||
      this.customerAddresses?.[0]
    );
  }

  get selectedAddress(): Address | null {
    const id = this.form?.get('addressId')?.value;
    return (
      this.customerAddresses?.find((a) => a.id === id) || this.defaultAddress
    );
  }

  async initParentInfo() {
    if (this.parentData) {
      this._orderData = this.parentData;
      return;
    } else if (this.parentId == null) {
      return;
    }
    const response = await firstValueFrom(
      this.apiService.get<WebApiResponse<Order>>(
        `${ApiType.Orders}/GetById/${this.parentId}`,
      ),
    );
    this._orderData = response.data ?? null;
  }

  async initAddressInfo() {
    if (!this._orderData?.businessPartnerId) {
      this.customerAddresses = [];
      return;
    }
    const response = await firstValueFrom(
      this.apiService.get<WebApiResponse<Address[]>>(
        `${ApiType.Addresses}/getAllByBusinessPartnerId/${this._orderData.businessPartnerId}`,
      ),
    );
    this.customerAddresses = (response.data ?? []).map(
      (addr) => new Address({ ...addr }),
    );
    // Seleciona o endereço padrão no form
    const defaultId = this.isEdit
      ? this.data?.addressId
      : this.defaultAddress?.id || null;
    this.form.get('addressId')?.setValue(defaultId);
  }

  async onProductSkuBlur(): Promise<void> {
    setTimeout(() => {
      const productSku = this.form.get('productSku')!.value?.trim();
      if (!productSku) {
        this.cleanProductSelection();
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
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (confirmed) {
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
              .subscribe((result: WebApiResponse<Product> | undefined) => {
                if (result) {
                  this.form.get('productId')!.setValue(result.data.id);
                  this.form.get('productSku')!.setValue(result.data.sku);
                  this.form.get('productName')!.setValue(result.data.name);
                  this.form.get('productType')!.setValue(result.data.type);
                  this.setupAutoComplete();
                } else {
                  this.cleanProductSelection();
                }
              });
          } else {
            this.cleanProductSelection();
          }
        });
      }
    }, 200);
  }

  async onProductNameBlur(): Promise<void> {
    setTimeout(() => {
      const productName = this.form.get('productName')!.value?.trim();
      if (!productName) {
        this.cleanProductSelection();
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
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (confirmed) {
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
              .subscribe((response: WebApiResponse<Product> | undefined) => {
                if (response) {
                  this.form.get('productId')!.setValue(response.data.id);
                  this.form.get('productSku')!.setValue(response.data.sku);
                  this.form.get('productName')!.setValue(response.data.name);
                  this.form.get('productType')!.setValue(response.data.type);
                  this.setupAutoComplete();
                } else {
                  this.cleanProductSelection();
                }
              });
          } else {
            this.cleanProductSelection();
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

  selectProduct(product: Product) {
    if (!product) {
      return;
    }

    // Validação de estoque
    if (
      product.type !== ProductType.Service &&
      (product.quantityInStock === undefined ||
        product.quantityInStock === null ||
        product.quantityInStock <= 0)
    ) {
      this.modalService.showNotification(
        false,
        'Produto sem estoque',
        `O produto "${product.name}" está sem estoque!`,
      );
      // Limpa seleção para forçar nova escolha
      this.form.get('productSku')?.setValue('');
      this.form.get('productName')?.setValue('');
      this.form.get('productType')?.setValue('');
      return;
    }

    if (!this.form.get('productId')) {
      this.form.addControl('productId', this.formBuilder.control(''));
    }

    if (this.data == null) {
      this.data = {} as OrderProduct;
    }

    this.data.productId = product.id;
    this.data.productSku = product.sku;
    this.data.productName = product.name;
    this.data.productType = product.type;
    this.data.price = product.price;

    this.form.patchValue({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      productType: product.type,
      price: product.price,
      priceFormatted: this.currencyService.formatCurrencyBRL(product.price),
    });

    this.updateTotalPrice();
  }

  onChangeAddressClick() {
    if (this.data?.status === OrderProductStatus.Returned) {
      return;
    }

    this.showAllAddresses = !this.showAllAddresses;
  }

  onSelectAddressRadio() {
    this.showAllAddresses = false;
  }

  submit(): void {
    this.formSubmitted = true;
    if (this.form.valid) {
      this.save.emit(this.form.getRawValue());
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  validateEndDate(): void {
    const start = this.form.get('startDate')?.value;
    const end = this.form.get('endDate')?.value;
    if (start && end) {
      // Compare only day/month/year, ignore time
      const startDate = new Date(start);
      const endDate = new Date(end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < startDate) {
        // Clear the field visually and logically
        if (this.endDateField && this.endDateField.clear) {
          this.endDateField.clear();
        }
        this.modalService.showNotification(
          false,
          'Data inválida',
          'A data de entrega não pode ser menor que a data de retirada.',
        );
      }
    }
  }

  openEditAddressModal(address: Address) {
    const initialState = {
      isEdit: true,
      data: address,
      id: address.id,
      parentId: address.businessPartnerId,
    };

    const dialogRef = this.modalService.showTemplateModal(
      AddressDetailsModalComponent,
      initialState,
    );
    dialogRef.afterClosed().subscribe((response: WebApiResponse<Address>) => {
      if (response) {
        // Atualiza endereço editado na lista
        const idx = this.customerAddresses.findIndex(
          (a) => a.id === response.data.id,
        );
        if (idx > -1) {
          this.customerAddresses[idx] = new Address({ ...response.data });
        }
        this.modalService.showNotification(
          response.status === ResponseStatus.Success,
          '',
          response.message,
        );
      }
    });
  }

  openAddAddressModal() {
    const initialState = {
      isEdit: false,
      parentId: this._orderData?.businessPartnerId,
    };

    const dialogRef = this.modalService.showTemplateModal(
      AddressDetailsModalComponent,
      initialState,
    );
    dialogRef.afterClosed().subscribe((response: WebApiResponse<Address>) => {
      if (response) {
        // Adiciona novo endereço ao fim da lista
        this.customerAddresses.push(new Address({ ...response.data }));
        this.modalService.showNotification(
          response.status === ResponseStatus.Success,
          '',
          response.message,
        );
      }
    });
  }
  private initForm(): void {
    const today = new Date();
    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(today.getDate() + 5);
    this.form = this.formBuilder.group({
      productId: ['', Validators.required],
      productSku: [''],
      productName: [''],
      productType: [{ value: '', disabled: true }],
      quantity: [1, [Validators.required, Validators.min(1)]],
      previousQuantity: [0],
      price: [0, [Validators.required]],
      priceFormatted: [{ value: 0 }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      totalPriceFormatted: [{ value: 0, disabled: true }],
      startDate: [today],
      endDate: [fiveDaysLater],
      status: [OrderProductStatus.InProgress, Validators.required],
      addressId: [null, Validators.required],
    });

    // Validação: endDate >= startDate
    this.form.get('endDate')?.valueChanges.subscribe(() => {
      this.validateEndDate();
    });
    this.form.get('startDate')?.valueChanges.subscribe(() => {
      const start = this.form.get('startDate')?.value;
      if (start) {
        const startDate = new Date(start);
        const endDateControl = this.form.get('endDate');
        const newEndDate = new Date(startDate);
        newEndDate.setDate(startDate.getDate() + 5);
        endDateControl?.setValue(newEndDate);
      }
      this.validateEndDate();
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
    if (this.data?.status === OrderProductStatus.Returned) {
      this.form.disable();
    } else if (this.isEdit && this.form) {
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
        return (this.products$ as any).source.value
          .filter((product: Product) =>
            (product.sku || '').toLowerCase().includes(filterValue),
          )
          .map((product: Product) => ({
            ...product,
            alreadyUsed: this.parentData?.orderProducts?.some(
              (op: OrderProduct) => op.productId === product.id,
            ),
            disabled:
              product.quantityInStock !== undefined &&
              product.quantityInStock <= 0,
          }));
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
          return (this.products$ as any).source.value
            .filter((product: Product) =>
              (product.name || '').toLowerCase().includes(filterValue),
            )
            .map((product: Product) => ({
              ...product,
              alreadyUsed: this.parentData?.orderProducts?.some(
                (op: OrderProduct) => op.productId === product.id,
              ),
              disabled:
                product.quantityInStock !== undefined &&
                product.quantityInStock <= 0,
            }));
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

  private cleanProductSelection() {
    this.form.get('productId')!.setValue('');
    this.markAsTouched('productId');
    this.form.get('productId')!.setErrors({ required: true });
    this.form.get('productSku')!.setValue('');
    this.markAsTouched('productSku');
    this.form.get('productSku')!.setErrors({ required: true });
    this.form.get('productName')!.setValue('');
    this.markAsTouched('productName');
    this.form.get('productName')!.setErrors({ required: true });
    this.form.get('productType')!.setValue('');
    this.markAsTouched('productType');
    this.form.get('productType')!.setErrors({ required: true });
  }
}
