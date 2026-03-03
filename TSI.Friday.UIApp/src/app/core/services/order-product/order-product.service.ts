import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderProductService {
  private orderProductChanged = new BehaviorSubject<boolean>(true);

  markOrderProductAsChanged(): void {
    this.orderProductChanged.next(true);
  }

  hasOrderProductChanged(): Observable<boolean> {
    return this.orderProductChanged.asObservable();
  }
}
