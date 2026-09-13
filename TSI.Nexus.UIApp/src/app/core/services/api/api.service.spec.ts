import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the service when instantiated', () => {
    // Act / Assert
    expect(service).toBeTruthy();
  });

  it('should hit the right URL with credentials and return the response body when get is called', () => {
    // Arrange
    const result: unknown[] = [];

    // Act
    service.get<unknown[]>('vehicles/getAll').subscribe((res) => result.push(...res));
    const req = httpMock.expectOne(`${environment.appUrl}/api/vehicles/getAll`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([{ id: '1' }]);

    // Assert
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should send the body and return the response when post is called', () => {
    // Arrange
    let response: { id: string } | undefined;

    // Act
    service.post<{ id: string }>('vehicles/add', { plate: 'ABC1234' }).subscribe((res) => {
      response = res;
    });
    const req = httpMock.expectOne(`${environment.appUrl}/api/vehicles/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ plate: 'ABC1234' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: '1' });

    // Assert
    expect(response).toEqual({ id: '1' });
  });

  it('should send the body and return the response when put is called', () => {
    // Arrange
    let response: { id: string } | undefined;

    // Act
    service
      .put<{ id: string }>('vehicles/update', { id: '1', plate: 'ABC1234' })
      .subscribe((res) => {
        response = res;
      });
    const req = httpMock.expectOne(`${environment.appUrl}/api/vehicles/update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id: '1', plate: 'ABC1234' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: '1' });

    // Assert
    expect(response).toEqual({ id: '1' });
  });

  it('should request a blob response type when getBlob is called', () => {
    // Arrange
    let response: Blob | undefined;

    // Act
    service.getBlob('documenttemplates/download/Order').subscribe((res) => {
      response = res;
    });
    const req = httpMock.expectOne(`${environment.appUrl}/api/documenttemplates/download/Order`);
    expect(req.request.responseType).toBe('blob');
    const blob = new Blob(['fake-pdf']);
    req.flush(blob);

    // Assert
    expect(response).toBe(blob);
  });

  it('should send the body as the request payload when delete is called', () => {
    // Arrange
    service.delete<void>('vehicles/remove', { id: '1' }).subscribe();

    // Act
    const req = httpMock.expectOne(`${environment.appUrl}/api/vehicles/remove`);

    // Assert
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ id: '1' });
    req.flush(null);
  });
});
