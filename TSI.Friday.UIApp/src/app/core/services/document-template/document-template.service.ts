import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiService,
  ApiType,
  DocumentTemplate,
  DocumentTemplateType,
  WebApiResponse,
} from '@friday/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DocumentTemplateService {
  private _baseEndPoint = ApiType.DocumentTemplates;

  constructor(
    private apiService: ApiService,
    private httpClient: HttpClient,
  ) {}

  getAll(): Observable<WebApiResponse<DocumentTemplate[]>> {
    return this.apiService.get<WebApiResponse<DocumentTemplate[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }

  getByType(
    type: DocumentTemplateType,
  ): Observable<WebApiResponse<DocumentTemplate>> {
    return this.apiService.get<WebApiResponse<DocumentTemplate>>(
      `${this._baseEndPoint}/getByType/${type}`,
    );
  }

  download(type: DocumentTemplateType): Observable<Blob> {
    return this.httpClient.get(
      `${environment.appUrl}/api/${this._baseEndPoint}/download/${type}`,
      { responseType: 'blob' },
    );
  }

  upload(
    type: DocumentTemplateType,
    file: File,
  ): Observable<WebApiResponse<DocumentTemplate>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post<WebApiResponse<DocumentTemplate>>(
      `${environment.appUrl}/api/${this._baseEndPoint}/upload/${type}`,
      formData,
    );
  }
}
