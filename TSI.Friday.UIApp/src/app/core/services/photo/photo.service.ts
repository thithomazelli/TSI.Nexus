import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private photoSubject = new BehaviorSubject<{
    fileName: string;
    userId?: string;
  }>({ fileName: '' });
  photo$ = this.photoSubject.asObservable();

  updateUserPhoto(fileName: string, userId?: string): void {
    this.photoSubject.next({ fileName, userId });
  }
}
