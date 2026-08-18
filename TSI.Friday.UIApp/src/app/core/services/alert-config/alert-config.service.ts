import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiType, AlertConfig, WebApiResponse } from '@friday/core';

@Injectable({
  providedIn: 'root',
})
export class AlertConfigService {
  private _baseEndPoint = ApiType.AlertConfigs;

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<AlertConfig[]>> {
    return this.apiService.get<WebApiResponse<AlertConfig[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }

  setEnabled(key: string, enabled: boolean): Observable<WebApiResponse<AlertConfig>> {
    return this.apiService.put<WebApiResponse<AlertConfig>>(
      `${this._baseEndPoint}/setEnabled/${key}/${enabled}`,
      null,
    );
  }

  setThresholdDays(
    key: string,
    thresholdDays: number,
  ): Observable<WebApiResponse<AlertConfig>> {
    return this.apiService.put<WebApiResponse<AlertConfig>>(
      `${this._baseEndPoint}/setThresholdDays/${key}/${thresholdDays}`,
      null,
    );
  }
}
