import { Component, Input } from '@angular/core';
import {
  Address,
  ModalService,
  WebApiResponse,
  BusinessPartner,
  AddressService,
  NotificationService,
  ResponseStatus,
} from '@friday/core';

import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { AddressDetailsModalComponent } from './components/address-details-modal/address-details-modal.component';
import { startWith, Subject, Subscription, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-address',
  standalone: false,
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss',
})
export class AddressComponent {
  @Input()
  parentData?: BusinessPartner | null = null;

  rowData: Address[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      hide: true,
    },
    {
      headerName: 'Endereço Padrão',
      field: 'isDefault',
      width: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const isDefault = params.value === true;
        return `<input type="checkbox" ${
          isDefault ? 'checked disabled' : ''
        } data-action="update" />`;
      },
    },
    {
      field: 'name',
      headerName: 'Nome',
      sortable: true,
      filter: true,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      sortable: true,
      filter: true,
      width: 115,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="edit" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'zipCode',
      headerName: 'CEP',
      sortable: true,
      filter: true,
      width: 100,
      valueFormatter: (params) => {
        const cep = (params.value || '').replace(/\D/g, '');
        return cep.length === 8
          ? cep.replace(/(\d{5})(\d{3})/, '$1-$2')
          : params.value;
      },
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="edit" class="ag-link">${value}</a>`;
      },
    },
    {
      headerName: 'Endereço',
      sortable: true,
      filter: true,
      width: 325,
      valueGetter: (params: any) => {
        const street = params.data?.street || '';
        const number = params.data?.number != null ? params.data.number : '';
        return street && number ? `${street}, ${number}` : street || number;
      },
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="edit" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'city',
      headerName: 'Cidade',
      sortable: true,
      filter: true,
      width: 200,
    },
    {
      field: 'state',
      headerName: 'Estado',
      sortable: true,
      filter: true,
      width: 100,
    },
    {
      headerName: 'Ações',
      minWidth: 150,
      sortable: false,
      filter: false,
      maxWidth: 400,
      resizable: true,
      width: 190,
      cellRenderer: () => {
        return `
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit data-action="edit""></i>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash data-action="delete"></i>
          </button>
        `;
      },
    },
  ];

  private _addressChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private addressService: AddressService,
    private modalService: ModalService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this._addressChangedSub = this.addressService.addressChanged$
      .pipe(startWith(null), takeUntil(this._destroy$))
      .subscribe(() => {
        this.getAddresses();
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._addressChangedSub) {
      this._addressChangedSub.unsubscribe();
    }
  }

  onOpenModal(initialState: any) {
    this.modalService.showTemplateModal(
      AddressDetailsModalComponent,
      initialState,
    );
  }

  deleteAddress(address: Address): void {
    if (address.isDefault === true) {
      this.modalService.showSweetNotification(
        '',
        'Não é possível excluir o endereço padrão.',
        'warning',
      );
      return;
    }

    this.addressService
      .deleteAddress(address)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Address>) => {
        this.rowData = this.rowData.filter((p) => p.id !== address.id);
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Endereço excluído',
          response.message,
          'success',
        );
      });
  }

  refreshAddresses(): void {
    this.addressService
      .refresh(this.parentData?.id ?? '')
      .pipe(
        tap({
          next: () =>
            this.notificationService.showMessage(
              ResponseStatus.Success,
              'Endereços atualizados com sucesso',
            ),
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao atualizar endereços',
            ),
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<Address[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  updateDefaultAddress(address: Address): void {
    address.isDefault = true;
    this.addressService
      .update(address)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Address>) => {
        this.getAddresses();
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Endereço atualizado',
          response.message,
          'success',
        );
      });
  }

  private getAddresses(): void {
    this.addressService
      .getAddresses(this.parentData?.id ?? '')
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Address[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
