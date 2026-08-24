import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, User, WebApiResponse } from '@nexus/core';

export interface UpdatePreferences {
  theme: string;
  language: string;
}

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  constructor(private apiService: ApiService) {}

  update(model: UpdatePreferences): Observable<WebApiResponse<User>> {
    return this.apiService.put<WebApiResponse<User>>(
      'account/preferences',
      model,
    );
  }
}
