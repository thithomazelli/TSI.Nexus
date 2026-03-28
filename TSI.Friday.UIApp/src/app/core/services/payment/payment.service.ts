import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiType } from '../../enums';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private _baseEndPoint = ApiType.Payments;
  private paymentChanged = new BehaviorSubject<boolean>(true);

  constructor(private apiService: ApiService) {}

  markPaymentAsChanged(): void {
    this.paymentChanged.next(true);
  }

  hasPaymentChanged(): Observable<boolean> {
    return this.paymentChanged.asObservable();
  }
}
