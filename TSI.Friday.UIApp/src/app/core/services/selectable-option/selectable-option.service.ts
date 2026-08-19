import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { SelectableOption } from '../../models/selectable-option.model';
import { SelectableOptionGroup } from '../../enums/selectable-option-group.enum';

@Injectable({
  providedIn: 'root',
})
export class SelectableOptionService {
  private _baseEndPoint = ApiType.SelectableOptions;

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<SelectableOption[]>> {
    return this.apiService.get<WebApiResponse<SelectableOption[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }

  getByGroup(
    group: SelectableOptionGroup,
  ): Observable<WebApiResponse<SelectableOption[]>> {
    return this.apiService.get<WebApiResponse<SelectableOption[]>>(
      `${this._baseEndPoint}/getByGroup/${group}`,
    );
  }

  add(option: SelectableOption): Observable<WebApiResponse<SelectableOption>> {
    return this.apiService.post<WebApiResponse<SelectableOption>>(
      `${this._baseEndPoint}/add`,
      option,
    );
  }

  update(
    option: SelectableOption,
  ): Observable<WebApiResponse<SelectableOption>> {
    return this.apiService.put<WebApiResponse<SelectableOption>>(
      `${this._baseEndPoint}/update`,
      option,
    );
  }

  remove(
    option: SelectableOption,
  ): Observable<WebApiResponse<SelectableOption>> {
    return this.apiService.delete<WebApiResponse<SelectableOption>>(
      `${this._baseEndPoint}/remove`,
      option,
    );
  }
}
