import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  get<T>(apiUrl: string, headers?: HttpHeaders): Observable<T> {
    return this.httpClient.get<T>(`${environment.appUrl}/api/${apiUrl}`, {
      headers,
    });
  }

  post<T>(apiUrl: string, model: any): Observable<T> {
    return this.httpClient.post<T>(
      `${environment.appUrl}/api/${apiUrl}`,
      model,
    );
  }

  put<T>(apiUrl: string, model: any): Observable<T> {
    return this.httpClient.put<T>(`${environment.appUrl}/api/${apiUrl}`, model);
  }

  delete<T>(apiUrl: string, model: any): Observable<T> {
    return this.httpClient.delete<T>(`${environment.appUrl}/api/${apiUrl}`, {
      body: model,
    });
  }
}
