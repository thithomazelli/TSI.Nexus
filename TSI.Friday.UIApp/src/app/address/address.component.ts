import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  ApiService,
  ApiType,
  Address,
  ModalService,
  WebApiResponse,
  Client,
} from '@friday/core';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { AddressDetailsModalComponent } from './components/address-details-modal/address-details-modal.component';

@Component({
  selector: 'app-address',
  standalone: false,
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss',
})
export class AddressComponent {
  @Input()
  parentData?: Client | null = null;

  @Output()
  addressUpdated = new EventEmitter<number>();

  private _baseEndPoint = ApiType.Addresses;

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
      headerName: '',
      sortable: false,
      filter: false,
      maxWidth: 400,
      resizable: true,
      width: 190,
      cellRenderer: () => {
        return `
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit"></i>
            Edit
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash"></i>  
            Delete
          </button>
        `;
      },
    },
  ];

  modalDetails = AddressDetailsModalComponent;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.getAddresses();
  }

  refreshAddresses(): void {
    this.getAddresses();
  }

  deleteAddress(address: Address): void {
    if (address.isDefault === true) {
      this.modalService.showSweetNotification(
        '',
        'Não é possível excluir o endereço padrão.',
        'warning'
      );
      return;
    }

    this.apiService
      .delete<WebApiResponse<Address>>(`${this._baseEndPoint}/remove`, address)
      .subscribe((response: WebApiResponse<Address>) => {
        this.getAddresses();
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          '',
          response.message,
          'success'
        );
      });
  }

  updateDefaultAddress(address: Address): void {
    address.isDefault = true;
    this.apiService
      .put<WebApiResponse<Address>>(`${this._baseEndPoint}/update`, address)
      .subscribe(() => {
        this.getAddresses();
        this.modalService.showSweetNotification(
          '',
          'Endereço padrão atualizado com sucesso.',
          'success'
        );
        this.refreshAddresses();
      });
  }

  private getAddresses(): void {
    this.apiService
      .get<WebApiResponse<Address[]>>(
        `${this._baseEndPoint}/getAllByClientId/${this.parentData?.id}`
      )
      .subscribe((response: WebApiResponse<Address[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
