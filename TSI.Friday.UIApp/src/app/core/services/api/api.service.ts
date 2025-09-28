import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly url = '';
  constructor(private httpClient: HttpClient) {}

  get<T>(apiUrl: string, headers?: HttpHeaders): Observable<T> {
    return this.httpClient.get<T>(`${environment.appUrl}/api/${apiUrl}`, {
      headers,
    });
  }

  post<T>(apiUrl: string, model: any): Observable<T> {
    return this.httpClient.post<T>(
      `${environment.appUrl}/api/${apiUrl}`,
      model
    );
  }

  put<T>(apiUrl: string, model: any): Observable<T> {
    return this.httpClient.put<T>(`${environment.appUrl}/api/${apiUrl}`, model);
  }

  delete<T>() {
    return;
  }
}
