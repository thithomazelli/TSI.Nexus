// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable, take } from 'rxjs';
// import { User } from '../../models';
// import { AccountService } from '../account/account.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class NavbarService {
//   private photoChange$ = new BehaviorSubject<string>('');
//   private _userLoggedId: User | null = null;

//   constructor(private accountService: AccountService) {
//     this.accountService.user$.pipe(take(1)).subscribe({
//       next: (user: User | null) => {
//         this._userLoggedId = user;
//       },
//     });
//   }

//   // onPhotoChange(): Observable<string> {
//   //   return this.photoChange$.asObservable();
//   // }

//   // emitPhotoChange(newImageUrl: string, user: User): void {
//   //   if (this._userLoggedId && user.id === this._userLoggedId.id) {
//   //     this.photoChange$.next(newImageUrl);
//   //   }
//   // }
// }

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private photoSubject = new BehaviorSubject<string>('');
  photo$ = this.photoSubject.asObservable();

  updateUserPhoto(fileName: string) {
    this.photoSubject.next(fileName);
  }
}
