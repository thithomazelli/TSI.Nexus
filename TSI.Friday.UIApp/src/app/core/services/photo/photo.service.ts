import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private _photoSubject = new BehaviorSubject<{
    fileName: string;
    userId?: string;
  }>({ fileName: '' });
  photo$ = this._photoSubject.asObservable();

  updateUserPhoto(fileName: string, userId?: string): void {
    this._photoSubject.next({ fileName, userId });
  }
}
