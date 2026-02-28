import { AG_GRID_LOCALE_BR } from '@ag-grid-community/locale';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from '@friday/core';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import { map } from 'rxjs';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
  standalone: false,
})
export class GridComponent<T> implements OnInit {
  @Input()
  baseEndPoint: string = '';

  @Input()
  className: string = '';

  @Input()
  compactView: boolean = false;

  @Input()
  rowData: T[] = [];

  @Input()
  columnDefs: ColDef[] = [];

  @Input()
  canAdd: boolean = true;

  @Input()
  refresh!: () => void;

  @Input()
  delete!: (data: T) => void;

  @Input()
  update!: (data: T) => void;

  @Output() openModal = new EventEmitter<any>();

  gridStyle: string = '';
  gridApi!: GridApi;
  quickFilter = '';
  localeText = AG_GRID_LOCALE_BR;

  noRowsOverlayTemplate =
    '<span class="text-muted p-3">Nenhum item encontrado</span>';

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  private _parentId: string | null = null;
  private readonly _actionsMap: {
    [key: string]: (data: any) => void;
  } = {
    edit: this.editAction.bind(this),
    view: this.viewAction.bind(this),
    delete: this.deleteAction.bind(this),
    update: this.updateAction.bind(this),
  };
  constructor(
    private modalService: ModalService,
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.gridStyle = this.compactView ? 'compact-view' : 'regular-view';

    this.activatedRoute.paramMap
      .pipe(map((params) => params.get('id')))
      .subscribe((id) => {
        this._parentId = id;
      });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.updateNoRowsOverlay();
  }

  onFilterTextBoxChanged(event: Event): void {
    this.quickFilter = (event.target as HTMLInputElement).value || '';
  }

  onCellClicked(event: CellClickedEvent): void {
    const target = event.event?.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const action = target.getAttribute('data-action');
    if (!action || !(action in this._actionsMap)) {
      return;
    }

    this._actionsMap[action](event.data);
  }

  openAddModal(): void {
    const initialState = {
      isEdit: false,
      id: null,
      parentId: this._parentId,
    };
    this.openModal.emit(initialState);
  }

  private editAction(data: any): void {
    const initialState = {
      isEdit: true,
      data: data,
      id: data.id,
      parentId: this._parentId,
    };
    this.openModal.emit(initialState);
  }

  private viewAction(data: any): void {
    this.routerService.navigateByUrl(`/${this.baseEndPoint}/${data.id}`);
  }

  private deleteAction(data: any): void {
    this.modalService
      .showSweetConfirmation(
        '',
        'Deseja realmente excluir este item?',
        'question',
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.confirmDelete(data);
        }
      });
  }

  private updateAction(data: any): void {
    this.update(data);
  }

  private confirmDelete(data: T): void {
    if (!data) {
      return;
    }

    this.delete(data);
  }

  private updateNoRowsOverlay(): void {
    if (!this.gridApi) {
      return;
    }

    if (!this.rowData || this.rowData.length === 0) {
      this.gridApi.showNoRowsOverlay();
    } else {
      this.gridApi.hideOverlay();
    }
  }
}
