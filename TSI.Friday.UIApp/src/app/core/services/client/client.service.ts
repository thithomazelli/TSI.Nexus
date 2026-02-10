import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService, ApiType, Client, WebApiResponse } from '@friday/core';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private clients$ = new BehaviorSubject<Client[]>([]);
  private loaded = false;
  private _baseEndPoint = ApiType.Clients;

  constructor(private apiService: ApiService) {}

  getClients(forceRefresh = false): Observable<Client[]> {
    if (!this.loaded || forceRefresh) {
      this.apiService
        .get<WebApiResponse<Client[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            this.clients$.next(response.data);
            this.loaded = true;
          }),
          catchError(() => {
            this.clients$.next([]);
            return of([]);
          }),
        )
        .subscribe();
    }
    return this.clients$.asObservable();
  }

  refreshClients(): void {
    this.loaded = false;
    this.getClients(true).subscribe();
  }

  addOrUpdateClient(client: Client): void {
    const current = this.clients$.value;
    const idx = current.findIndex((c) => c.id === client.id);
    if (idx > -1) {
      current[idx] = client;
    } else {
      current.push(client);
    }
    this.clients$.next([...current]);
  }
}
