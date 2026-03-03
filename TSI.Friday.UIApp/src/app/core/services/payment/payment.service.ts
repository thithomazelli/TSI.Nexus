import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private paymentChanged = new BehaviorSubject<boolean>(true);

  markPaymentAsChanged(): void {
    this.paymentChanged.next(true);
  }

  hasPaymentChanged(): Observable<boolean> {
    return this.paymentChanged.asObservable();
  }
}
