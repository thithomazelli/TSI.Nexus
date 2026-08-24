import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@nexus/core';
import { Commission } from '@nexus/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommissionService {
  private _baseEndPoint = ApiType.Commissions;

  constructor(private apiService: ApiService) {}

  update(commission: Commission): Observable<WebApiResponse<Commission>> {
    return this.apiService.put<WebApiResponse<Commission>>(
      `${this._baseEndPoint}/update`,
      commission,
    );
  }
}
