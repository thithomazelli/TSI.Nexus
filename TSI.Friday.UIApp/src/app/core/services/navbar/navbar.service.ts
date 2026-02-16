import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavbarService {
  private photoChange$ = new BehaviorSubject<string>('');

  constructor() {}

  onPhotoChange(): Observable<string> {
    return this.photoChange$.asObservable();
  }

  emitPhotoChange(imageUrl: string): void {
    this.photoChange$.next(imageUrl);
  }
}
