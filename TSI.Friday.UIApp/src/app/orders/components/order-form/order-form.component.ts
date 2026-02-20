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
  ClientService,
  Client,
  Order,
  OrderStatus,
  FormBaseComponent,
  ModalService,
  CurrencyService,
  OrderProduct,
} from '@friday/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { Observable, startWith, map } from 'rxjs';
import { ClientDetailsModalComponent } from '../../../clients/components/client-details-modal/client-details-modal.component';
import { OrderProductsDetailsModalComponent } from '../../../order-products/components/order-product-details-modal/order-products-details-modal.component';

@Component({
  selector: 'app-order-form',
  standalone: false,
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Output()
  save = new EventEmitter<Order>();

  @Output()
  cancel = new EventEmitter<void>();

  @ViewChild('firstInput')
  firstInput!: ElementRef;

  @Input()
  isEdit = false;

  @Input()
  data?: Order | null = <Order>{
    orderProducts: [],
  };

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  clients$!: Observable<Client[]>;
  filteredClients$!: Observable<Client[]>;

  orderStatusOptions = [
    { value: OrderStatus.Open, label: 'Em Aberto' },
    { value: OrderStatus.Closed, label: 'Fechado' },
    { value: OrderStatus.WaitingPayment, label: 'Aguardando Pagamento' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private clientService: ClientService,
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

  async onClientBlur(): Promise<void> {
    setTimeout(() => {
      const clientName = this.form.get('clientName')!.value?.trim();
      const clientId = this.form.get('clientId')!.value;
      if (!clientName || !clientId) {
        this.cleanClientSelection();
        return;
      }
      // Verifica se o nome existe na lista de clientes
      const clients = (this.clients$ as any).source.value as Client[];
      const found = clients.find((c) => c.name === clientName);
      if (!found) {
        const confirmRef = this.modalService.showConfirmation({
          title: 'Cliente não encontrado',
          message: `O cliente "${clientName}" não existe. Deseja adicioná-lo?`,
          cancelButtonText: 'Cancelar',
          confirmButtonText: 'Sim',
          confirmDelete: async () => {
            // Abrir modal de adicionar cliente
            const clientFormRef: MatDialogRef<any> =
              this.modalService.showTemplateModal(ClientDetailsModalComponent, {
                data: { name: clientName },
                width: '600px',
                disableClose: true,
              });
            clientFormRef
              .afterClosed()
              .subscribe((result: Client | undefined) => {
                if (result) {
                  this.clientService.addOrUpdateClient(result);
                  this.form.get('clientName')!.setValue(result.name);
                  this.form.get('clientId')!.setValue(result.id);
                } else {
                  this.cleanClientSelection();
                }
              });
          },
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) {
            this.cleanClientSelection();
          }
        });
      }
    }, 200);
  }

  private cleanClientSelection(): void {
    this.form.get('clientId')!.setValue('');
    this.markAsTouched('clientId');
    this.form.get('clientId')!.setErrors({ required: true });
    this.form.get('clientName')!.setValue('');
    this.markAsTouched('clientName');
    this.form.get('clientName')!.setErrors({ required: true });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    Object.assign(this.data!, this.form.getRawValue());
    this.save.emit(this.data!);
  }

  doCancel(): void {
    this.cancel.emit();
  }

  removeProduct(index: number): void {
    if (!this.data?.orderProducts) {
      return;
    }
    this.data.orderProducts.splice(index, 1);
    this.updatePriceFields();
    this.updateTotalPriceFields();
  }

  openOrderProductsModal() {
    const data = { ...this.data, ...this.form.getRawValue() };

    const initialState = {
      isEdit: false,
      id: null,
      parentId: null,
      parentData: data,
    };

    if (!this.form.get('clientId')?.value) {
      this.modalService.showNotification(
        false,
        '',
        'Por favor, selecione um cliente antes de adicionar produtos.',
      );
      return;
    }

    const ref = this.modalService.showTemplateModal(
      OrderProductsDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe((orderProduct: OrderProduct) => {
        this.data?.orderProducts?.push(orderProduct);

        this.updatePriceFields();
        this.updateTotalPriceFields();
        this.modalService.showNotification(
          true,
          '',
          'Produto adicionado com sucesso',
        );
        ref.close();
      });
    }

    console.log('Form status:', this.form.status);
    console.log('Form errors:', this.form.errors);
    console.log('Controles com erro:');
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        console.log(`- ${key}:`, control.errors);
      }
    });
  }

  private updatePriceFields(): void {
    const total = this.data?.orderProducts?.reduce(
      (sum, p) => sum + (p?.totalPrice || 0) * (p?.quantity || 0),
      0,
    );
    this.data!.price = total;
    this.form.get('price')?.setValue(total);
    this.form
      .get('priceFormatted')
      ?.setValue(this.currencyService.formatCurrencyBRL(total));
  }

  private updateTotalPriceFields(): void {
    const price = Number(this.form.get('price')?.value) || 0;
    const discount = Number(this.form.get('discount')?.value) || 0;
    const total = price * (1 - discount / 100);
    this.form.get('totalPrice')?.setValue(total);
    this.form
      .get('totalPriceFormatted')
      ?.setValue(this.currencyService.formatCurrencyBRL(total));
  }

  private setupAutoComplete(): void {
    this.clients$ = this.clientService.getClients();
    this.filteredClients$ = this.form.get('clientName')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const filterValue = value?.toLowerCase() || '';
        if (!filterValue) {
          return [];
        }
        return (this.clients$ as any).source.value.filter((client: Client) =>
          (client.name || client.name || '')
            .toLowerCase()
            .includes(filterValue),
        );
      }),
    );
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      orderNumber: [''],
      clientId: [null],
      clientName: [''],
      description: [''],
      status: [OrderStatus.Open, Validators.required],
      price: [{ value: 0, disabled: true }],
      priceFormatted: [{ value: 0, disabled: true }],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      totalPriceFormatted: [{ value: 0, disabled: true }],
    });

    if (this.isEdit) {
      this.form.addControl('id', this.formBuilder.control(''));
    } else {
      // Atualiza clientId ao selecionar cliente
      this.form.get('clientName')!.valueChanges.subscribe((name) => {
        const client = (this.clients$ as any).source.value.find(
          (c: Client) => (c.name || c.name) === name,
        );
        if (client) {
          this.form.get('clientId')!.setValue(client.id);
        }
      });
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      // Garante que price e totalPrice nunca sejam undefined ou null
      const patch = {
        ...this.data,
        priceFormatted: this.currencyService.formatCurrencyBRL(this.data.price),
        totalPriceFormatted: this.currencyService.formatCurrencyBRL(
          this.data.totalPrice,
        ),
      };

      this.form.patchValue(patch);
    }
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('clientName')?.disable();
      this.form.get('orderNumber')?.disable();
    }
  }

  private totalPriceChange(): void {
    this.form
      .get('discount')
      ?.valueChanges.subscribe(() => this.updateTotalPriceFields());
  }
}
